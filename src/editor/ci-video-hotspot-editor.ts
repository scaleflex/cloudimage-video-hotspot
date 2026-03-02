import type { VideoHotspotItem, Placement, TriggerMode } from '../core/types';
import type { EditorConfig, EditorMode, EditorSnapshot } from './types';
import { createElement, injectStyles } from '../utils/dom';
import { EventEmitter, addListener } from '../utils/events';
import { CIVideoHotspot } from '../core/ci-video-hotspot';
import { EditorToolbar } from './editor-toolbar';
import { SelectionManager } from './selection-manager';
import { PropertyPanel } from './property-panel';
import { DragManager } from './drag-manager';
import { UndoManager } from './undo-manager';
import { TimelinePanel } from './timeline-panel';
import { TrackingManager } from './tracking/tracking-manager';
import editorCss from './editor.css?inline';
import viewerCss from '../styles/index.css?inline';

export class CIVideoHotspotEditor {
  private config: Required<
    Pick<EditorConfig, 'src' | 'defaultTrigger' | 'defaultPlacement' | 'maxHistory'>
  > &
    EditorConfig;
  private rootEl: HTMLElement;
  private editorEl!: HTMLElement;
  private canvasEl!: HTMLElement;
  private sidebarEl!: HTMLElement;
  private statusEl!: HTMLElement;

  private viewer: CIVideoHotspot | null = null;
  private hotspots: VideoHotspotItem[] = [];
  private mode: EditorMode = 'select';
  private nextId = 1;

  private toolbar!: EditorToolbar;
  private selection!: SelectionManager;
  private propertyPanel!: PropertyPanel;
  private dragManager!: DragManager;
  private undoManager!: UndoManager;
  private timelinePanel!: TimelinePanel;
  private trackingManager!: TrackingManager;

  readonly events = new EventEmitter();
  private cleanups: (() => void)[] = [];
  private toastEl: HTMLElement | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private timeUpdateInterval: ReturnType<typeof setInterval> | null = null;

  constructor(element: HTMLElement | string, config: EditorConfig) {
    this.rootEl =
      typeof element === 'string'
        ? document.querySelector<HTMLElement>(element)!
        : element;
    if (!this.rootEl) throw new Error('CIVideoHotspotEditor: element not found');

    this.config = {
      defaultTrigger: 'click' as TriggerMode,
      defaultPlacement: 'top' as Placement,
      maxHistory: 50,
      ...config,
    };

    this.hotspots = config.hotspots ? structuredClone(config.hotspots) : [];
    // Ensure unique IDs and track next ID
    for (const h of this.hotspots) {
      const num = parseInt(h.id.replace(/\D/g, ''), 10);
      if (!isNaN(num) && num >= this.nextId) this.nextId = num + 1;
    }

    injectStyles(viewerCss);
    this.injectEditorStyles();
    this.buildDOM();
    this.initModules();
    this.rebuildViewer();
    this.updateStatus();
  }

  // === DOM ===

  private injectEditorStyles(): void {
    const id = 'ci-editor-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = editorCss;
    document.head.appendChild(style);
  }

  private buildDOM(): void {
    this.editorEl = createElement('div', 'ci-editor');
    if (this.config.theme === 'dark') {
      this.editorEl.classList.add('ci-editor--dark');
    }
    this.canvasEl = createElement('div', 'ci-editor-canvas');
    this.sidebarEl = createElement('div', 'ci-editor-sidebar');
    this.statusEl = createElement('div', 'ci-editor-status');

    const bodyEl = createElement('div', 'ci-editor-body');
    bodyEl.appendChild(this.canvasEl);
    bodyEl.appendChild(this.sidebarEl);

    this.editorEl.appendChild(bodyEl);
    this.editorEl.appendChild(this.statusEl);

    this.rootEl.innerHTML = '';
    this.rootEl.appendChild(this.editorEl);
  }

  private initModules(): void {
    // Undo manager (must be before toolbar, which reads undo state)
    this.undoManager = new UndoManager(this, this.config.maxHistory);
    // Selection
    this.selection = new SelectionManager(this);
    // Toolbar (reads undo + selection state)
    this.toolbar = new EditorToolbar(this.editorEl, this);
    // Property panel
    this.propertyPanel = new PropertyPanel(this.sidebarEl, this);
    // Drag manager
    this.dragManager = new DragManager(this);
    // Timeline panel
    this.timelinePanel = new TimelinePanel(this.editorEl, this);
    // Tracking manager
    this.trackingManager = new TrackingManager(this);

    // Click on canvas to add hotspot
    const clickCleanup = addListener(this.canvasEl, 'click', (e) => {
      if (this.mode !== 'add') return;
      const target = e.target as HTMLElement;
      // Don't place if clicking a marker
      if (target.closest('[data-hotspot-id]')) return;

      const videoEl = this.canvasEl.querySelector<HTMLElement>(
        '.ci-video-hotspot-overlay, video, iframe',
      );
      const rect = videoEl?.getBoundingClientRect();
      if (!rect) return;

      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Clamp to video bounds
      if (x < 0 || x > 100 || y < 0 || y > 100) return;

      const currentTime = this.getVideoCurrentTime();
      this.addHotspot({
        x: `${Math.round(x * 100) / 100}%`,
        y: `${Math.round(y * 100) / 100}%`,
        startTime: Math.round(currentTime * 10) / 10,
        endTime: Math.round((currentTime + 10) * 10) / 10,
      });
    });
    this.cleanups.push(clickCleanup);

    // Keyboard shortcuts (scoped to editor)
    const keyCleanup = addListener(document, 'keydown', (e) => {
      // Don't handle if focus is in an input/textarea/select
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const mod = e.metaKey || e.ctrlKey;
      // Non-modifier shortcuts only fire when focus is within this editor
      const focusInEditor =
        this.editorEl.contains(document.activeElement) ||
        this.editorEl.contains(e.target as Node);

      if (mod && e.key === 'z' && !e.shiftKey && focusInEditor) {
        e.preventDefault();
        this.undoManager.undo();
      } else if (mod && e.key === 'z' && e.shiftKey && focusInEditor) {
        e.preventDefault();
        this.undoManager.redo();
      } else if (mod && e.key === 'y' && focusInEditor) {
        e.preventDefault();
        this.undoManager.redo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && focusInEditor) {
        const id = this.selection.getSelectedId();
        if (id) {
          e.preventDefault();
          this.removeHotspot(id);
        }
      } else if (e.key === 'Escape' && focusInEditor) {
        if (this.mode === 'add') {
          this.setMode('select');
        } else {
          this.selection.deselect();
        }
      } else if (e.key === 'a' && !mod && focusInEditor) {
        this.setMode(this.mode === 'add' ? 'select' : 'add');
      } else if (e.key === 'v' && !mod && focusInEditor) {
        this.setMode('select');
      } else if (e.key === 't' && !mod && focusInEditor) {
        this.setMode('track');
      } else if (e.key === ' ' && !mod && focusInEditor) {
        e.preventDefault();
        this.togglePlayback();
      }
    });
    this.cleanups.push(keyCleanup);

    // Save initial state
    this.undoManager.saveInitial();
  }

  // === Viewer ===

  rebuildViewer(): void {
    if (this.destroyed) return;
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }

    this.viewer = new CIVideoHotspot(this.canvasEl, {
      src: this.config.src,
      hotspots: this.hotspots,
      trigger: 'click',
      pulse: false,
      controls: true,
      hotspotNavigation: false,
    });

    // Poll time updates for timeline sync
    this.timeUpdateInterval = setInterval(() => {
      if (!this.viewer || this.destroyed) return;
      const time = this.getVideoCurrentTime();
      const duration = this.getVideoDuration();
      if (duration > 0) {
        this.timelinePanel.setDuration(duration);
      }
      this.timelinePanel.setCurrentTime(time);
    }, 250);

    // Re-apply selection visuals
    this.selection?.refreshMarkerVisuals();
    // Re-bind drag listeners
    this.dragManager?.bind();
    this.timelinePanel?.render();
  }

  // === Hotspot CRUD ===

  addHotspot(partial: Partial<VideoHotspotItem> = {}): VideoHotspotItem | undefined {
    if (this.destroyed) return undefined;
    const id = `hotspot-${this.nextId++}`;
    const hotspot: VideoHotspotItem = {
      ...partial,
      id,
      x: partial.x ?? '50%',
      y: partial.y ?? '50%',
      startTime: partial.startTime ?? 0,
      endTime: partial.endTime ?? 10,
      label: partial.label || `Hotspot ${this.hotspots.length + 1}`,
      trigger: partial.trigger || this.config.defaultTrigger,
      placement: partial.placement || this.config.defaultPlacement,
      data: partial.data || {},
    };

    this.hotspots.push(hotspot);
    this.rebuildViewer();
    this.selection.select(id);
    this.undoManager.save();
    this.notifyChange('hotspot:add');
    this.updateStatus();
    return hotspot;
  }

  removeHotspot(id: string): void {
    if (this.destroyed) return;
    const idx = this.hotspots.findIndex((h) => h.id === id);
    if (idx === -1) return;

    this.hotspots.splice(idx, 1);
    if (this.selection.getSelectedId() === id) {
      this.selection.deselect();
    }
    this.rebuildViewer();
    this.undoManager.save();
    this.notifyChange('hotspot:remove');
    this.updateStatus();
  }

  updateHotspot(id: string, updates: Partial<VideoHotspotItem>): void {
    if (this.destroyed) return;
    const idx = this.hotspots.findIndex((h) => h.id === id);
    if (idx === -1) return;

    this.hotspots[idx] = { ...this.hotspots[idx], ...updates };
    this.rebuildViewer();
    this.undoManager.save();
    this.notifyChange('hotspot:update');
    this.updateStatus();
  }

  // === State Access ===

  getHotspots(): VideoHotspotItem[] {
    return structuredClone(this.hotspots);
  }

  getHotspot(id: string): VideoHotspotItem | undefined {
    const hotspot = this.hotspots.find((h) => h.id === id);
    return hotspot ? structuredClone(hotspot) : undefined;
  }

  setHotspots(hotspots: VideoHotspotItem[]): void {
    if (this.destroyed) return;
    this.hotspots = structuredClone(hotspots);
    this.selection.deselect();
    this.rebuildViewer();
    this.updateStatus();
  }

  getMode(): EditorMode {
    return this.mode;
  }

  setMode(mode: EditorMode): void {
    if (this.destroyed) return;
    this.mode = mode;
    this.canvasEl.classList.toggle('ci-editor-canvas--add-mode', mode === 'add');
    this.canvasEl.classList.toggle('ci-editor-canvas--track-mode', mode === 'track');
    this.events.emit('mode:change', mode);
    this.toolbar.updateState();
    this.updateStatus();
  }

  getCanvasEl(): HTMLElement {
    return this.canvasEl;
  }

  getViewer(): CIVideoHotspot | null {
    return this.viewer;
  }

  getSrc(): string {
    return this.config.src;
  }

  setSrc(src: string): void {
    if (this.destroyed) return;
    this.config.src = src;
    this.rebuildViewer();
  }

  getSelection(): SelectionManager {
    return this.selection;
  }

  getToolbar(): EditorToolbar {
    return this.toolbar;
  }

  getUndoManager(): UndoManager {
    return this.undoManager;
  }

  getTrackingManager(): TrackingManager {
    return this.trackingManager;
  }

  // === Video Control ===

  getVideoCurrentTime(): number {
    if (!this.viewer) return 0;
    try {
      return (this.viewer as any).getCurrentTime?.() ?? 0;
    } catch {
      return 0;
    }
  }

  getVideoDuration(): number {
    if (!this.viewer) return 0;
    try {
      return (this.viewer as any).getDuration?.() ?? 0;
    } catch {
      return 0;
    }
  }

  seekVideo(time: number): void {
    if (!this.viewer) return;
    try {
      (this.viewer as any).seek?.(time);
    } catch {
      // ignore
    }
  }

  togglePlayback(): void {
    if (!this.viewer) return;
    try {
      (this.viewer as any).togglePlay?.();
    } catch {
      // ignore
    }
  }

  // === Snapshot (for undo/redo) ===

  createSnapshot(): EditorSnapshot {
    return {
      hotspots: structuredClone(this.hotspots),
      selectedId: this.selection.getSelectedId(),
    };
  }

  restoreSnapshot(snapshot: EditorSnapshot): void {
    if (this.destroyed) return;
    this.hotspots = structuredClone(snapshot.hotspots);
    this.rebuildViewer();
    if (snapshot.selectedId && this.hotspots.find((h) => h.id === snapshot.selectedId)) {
      this.selection.select(snapshot.selectedId);
    } else {
      this.selection.deselect();
    }
    this.notifyChange('change');
    this.updateStatus();
  }

  // === Export ===

  exportJSON(): string {
    return JSON.stringify(this.hotspots, null, 2);
  }

  importJSON(json: string): void {
    if (this.destroyed) return;
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) throw new Error('Expected an array of hotspots');
    for (const h of parsed) {
      if (!h.id || h.x == null || h.y == null) {
        throw new Error('Each hotspot must have id, x, y, startTime, and endTime');
      }
    }
    this.hotspots = parsed;
    // Update nextId
    for (const h of this.hotspots) {
      const num = parseInt(h.id.replace(/\D/g, ''), 10);
      if (!isNaN(num) && num >= this.nextId) this.nextId = num + 1;
    }
    this.selection.deselect();
    this.rebuildViewer();
    this.undoManager.save();
    this.notifyChange('change');
    this.updateStatus();
  }

  // === Notifications ===

  private notifyChange(event: string): void {
    this.events.emit(event);
    this.events.emit('change');
    this.config.onChange?.(this.getHotspots());
    this.propertyPanel?.refresh();
  }

  private updateStatus(): void {
    const count = this.hotspots.length;
    const selected = this.selection?.getSelectedId();
    const modeLabel = this.mode === 'add' ? 'Add mode' : 'Select mode';
    const parts = [`${count} hotspot${count !== 1 ? 's' : ''}`, modeLabel];
    if (selected) parts.push(`Selected: ${selected}`);
    this.statusEl.textContent = parts.join('  |  ');
  }

  // === Toast ===

  showToast(message: string, duration = 2000): void {
    if (this.destroyed) return;
    if (!this.toastEl) {
      this.toastEl = createElement('div', 'ci-editor-toast');
      this.editorEl.appendChild(this.toastEl);
    }
    this.toastEl.textContent = message;
    this.toastEl.classList.add('ci-editor-toast--visible');
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl?.classList.remove('ci-editor-toast--visible');
      this.toastTimer = null;
    }, duration);
  }

  // === Lifecycle ===

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
    this.trackingManager.destroy();
    this.dragManager.destroy();
    this.selection.destroy();
    this.toolbar.destroy();
    this.timelinePanel.destroy();
    this.viewer?.destroy();
    this.events.removeAll();
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    this.toastEl = null;
    this.rootEl.innerHTML = '';
  }
}
