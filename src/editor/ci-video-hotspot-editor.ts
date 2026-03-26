import CIVideoHotspot from '../index';
import type { VideoHotspotItem, Keyframe, MarkerStyle, TriggerMode } from '../core/types';
import type { EditorConfig, EditorMode } from './types';
import { UndoManager } from './undo-manager';
import { SelectionManager } from './selection-manager';
import { DragManager } from './drag-manager';
import { TimelineManager } from './timeline-manager';
import { PropertyPanel } from './property-panel';
import { CardEditor } from './card-editor';
import { EditorToolbar } from './editor-toolbar';
import editorCss from './editor.css?inline';

export class CIVideoHotspotEditor {
  private config: Required<Pick<EditorConfig, 'src' | 'defaultTrigger' | 'defaultMarkerStyle' | 'pauseOnInteract' | 'maxHistory'>> & EditorConfig;
  private rootEl: HTMLElement;

  private viewer: CIVideoHotspot | null = null;
  private hotspots: VideoHotspotItem[] = [];
  private mode: EditorMode = 'editor';
  private nextId = 1;
  private _placementMode = false;
  private videoDuration = 60;
  private seekAfterRebuild: number | null = null;
  private editorHandlersBound = false;
  private editorMarkerObserver: MutationObserver | null = null;
  private pendingLoadHide: (() => void) | null = null;

  private globalTrigger: TriggerMode;
  private globalPauseOnInteract: boolean;
  private globalMarkerStyle: MarkerStyle;

  // Modules
  private undoManager!: UndoManager;
  private selection!: SelectionManager;
  private dragManager!: DragManager;
  private timelineManager!: TimelineManager;
  private propertyPanel!: PropertyPanel;
  private cardEditorManager!: CardEditor;
  private toolbar!: EditorToolbar;

  // DOM elements (from existing HTML)
  private videoAreaEl!: HTMLElement;
  private sidebarEl!: HTMLElement;
  private videoViewerEl!: HTMLElement;
  private topBarEl!: HTMLElement;

  constructor(element: HTMLElement | string, config: EditorConfig) {
    this.rootEl = typeof element === 'string'
      ? document.querySelector<HTMLElement>(element)!
      : element;
    if (!this.rootEl) throw new Error('CIVideoHotspotEditor: element not found');

    this.config = {
      defaultTrigger: 'hover' as TriggerMode,
      defaultMarkerStyle: 'dot' as MarkerStyle,
      pauseOnInteract: true,
      maxHistory: 50,
      ...config,
    };

    this.globalTrigger = this.config.defaultTrigger;
    this.globalPauseOnInteract = this.config.pauseOnInteract;
    this.globalMarkerStyle = this.config.defaultMarkerStyle;

    if (config.hotspots) {
      this.hotspots = structuredClone(config.hotspots);
    } else if (config.sampleHotspots) {
      this.hotspots = getSampleHotspots();
    }

    // Track next ID
    for (const h of this.hotspots) {
      const num = parseInt(h.id.replace(/\D/g, ''), 10);
      if (!isNaN(num) && num >= this.nextId) this.nextId = num + 1;
    }

    this.injectStyles();
    this.resolveDOM();
    this.initModules();
    this.setupModeToggle();
    this.setupKeyboardShortcuts();
    this.applyModeToDOM();
    this.rebuildViewer();
  }

  // === Styles ===

  private injectStyles(): void {
    const id = 'ci-veditor-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = editorCss;
    document.head.appendChild(style);
  }

  // === DOM ===

  private resolveDOM(): void {
    this.videoAreaEl = this.rootEl.querySelector('#video-area') || this.rootEl.querySelector('.app-video-area')!;
    this.sidebarEl = this.rootEl.querySelector('#sidebar') || this.rootEl.querySelector('.app-sidebar')!;
    this.videoViewerEl = this.rootEl.querySelector('#video-viewer')!;
    this.topBarEl = this.rootEl.querySelector('#app-top-bar') || this.rootEl.querySelector('.app-top-bar')!;

    // Set initial video URL
    const urlInput = this.rootEl.querySelector('#video-url-input') as HTMLInputElement;
    if (urlInput) urlInput.value = this.config.src;
  }

  private applyModeToDOM(): void {
    // Update all toggle buttons
    this.rootEl.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.classList.toggle('mode-btn--active', (btn as HTMLElement).dataset.mode === this.mode);
    });
    this.sidebarEl?.classList.toggle('app-sidebar--hidden', this.mode === 'view');
    this.rootEl.querySelector('#mode-toggle-overlay')?.classList.toggle('app-mode-toggle--hidden', this.mode === 'editor');
    this.topBarEl?.classList.toggle('app-top-bar--hidden', this.mode === 'view');
  }

  // === Modules ===

  private initModules(): void {
    this.undoManager = new UndoManager(this, this.config.maxHistory);
    this.selection = new SelectionManager(this);
    this.dragManager = new DragManager(this);
    this.timelineManager = new TimelineManager(this);
    this.propertyPanel = new PropertyPanel(this.sidebarEl, this);
    this.toolbar = new EditorToolbar(this.topBarEl, this, !!this.config.demoMode);

    // Card editor
    const overlayEl = document.getElementById('card-editor-overlay')!;
    const modalEl = document.getElementById('card-editor-modal')!;
    this.cardEditorManager = new CardEditor(this, overlayEl, modalEl, !!this.config.demoMode);
  }

  // === Mode ===

  private setupModeToggle(): void {
    // Overlay toggle (view mode — floats on video)
    const overlayToggle = this.rootEl.querySelector('#mode-toggle-overlay');
    overlayToggle?.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.mode-btn') as HTMLElement;
      if (!btn) return;
      const newMode = btn.dataset.mode as EditorMode;
      if (newMode && newMode !== this.mode) this.setMode(newMode);
    });
  }

  setMode(newMode: EditorMode): void {
    this.mode = newMode;
    this.selection.deselect();
    this._placementMode = false;
    this.videoAreaEl.classList.remove('app-video-area--crosshair');
    this.applyModeToDOM();
    this.updateViewer();
  }

  getMode(): EditorMode {
    return this.mode;
  }

  // === Viewer ===

  rebuildViewer(skipSeekSave = false): void {
    if (this.mode === 'editor' && !skipSeekSave) {
      const selectedId = this.selection.getSelectedHotspotId();
      const selectedIdx = this.selection.getSelectedPointIndex();
      if (selectedId && selectedIdx !== null) {
        const hotspot = this.hotspots.find(h => h.id === selectedId);
        if (hotspot?.keyframes?.[selectedIdx]) {
          this.seekAfterRebuild = hotspot.keyframes[selectedIdx].time;
        } else {
          this.seekAfterRebuild = this.viewer?.getCurrentTime() ?? null;
        }
      } else {
        this.seekAfterRebuild = this.viewer?.getCurrentTime() ?? null;
      }
    }

    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }

    this.videoViewerEl.innerHTML = '';

    this.viewer = new CIVideoHotspot(this.videoViewerEl, this.getViewerConfig());
  }

  private getViewerConfig() {
    return {
      src: this.config.src,
      hotspots: this.hotspots.map(h => ({ ...h, markerStyle: this.globalMarkerStyle })),
      trigger: this.mode === 'editor' ? 'click' as const : this.globalTrigger,
      pauseOnInteract: this.globalPauseOnInteract,
      controls: true,
      clickToPlay: this.mode !== 'editor',
      hotspotNavigation: false,
      timelineIndicators: 'none' as const,
      onTimeUpdate: () => this.selection.updateMarkerVisibility(),
      onPlay: () => {
        if (this.mode === 'editor' && this.selection.getSelectedHotspotId()) {
          const markersEl = document.querySelector('.ci-video-hotspot-markers');
          if (markersEl && !this.editorMarkerObserver) {
            this.editorMarkerObserver = new MutationObserver(() => this.selection.updateMarkerVisibility());
            this.editorMarkerObserver.observe(markersEl, { childList: true });
          }
        }
      },
      onPause: () => {
        this.editorMarkerObserver?.disconnect();
        this.editorMarkerObserver = null;
      },
      onReady: () => {
        if (this.pendingLoadHide) this.pendingLoadHide();

        this.videoDuration = this.viewer?.getDuration() || 60;
        this.refresh();
        if (this.mode === 'editor') {
          this.setupEditorHandlers();
          if (this.seekAfterRebuild !== null) {
            this.viewer?.seek(this.seekAfterRebuild);
            this.viewer?.pause();
            this.seekAfterRebuild = null;
          }
        }
        // Deselect point when clicking the progress bar (seeking)
        const progressBar = document.querySelector('.ci-video-hotspot-progress-bar');
        progressBar?.addEventListener('mousedown', (e) => {
          if ((e.target as HTMLElement).closest('.timeline-kf-dot, .timeline-start-dot')) return;
          this.selection.setSelectedPointIndex(null);
          this.propertyPanel.render();
        });
      },
    };
  }

  updateViewer(hotspotsOnly = false): void {
    if (!this.viewer) return;

    if (hotspotsOnly) {
      this.viewer.update({
        hotspots: this.hotspots.map(h => ({ ...h, markerStyle: this.globalMarkerStyle })),
      });
    } else {
      this.viewer.update(this.getViewerConfig());
    }

    this.refresh();
    this.setupEditorHandlers();
    this.selection.updateMarkerVisibility();
  }

  // === Editor Handlers ===

  private setupEditorHandlers(): void {
    if (this.editorHandlersBound) return;
    this.editorHandlersBound = true;

    // Prevent popover cards in editor mode
    this.videoAreaEl.addEventListener('click', (e) => {
      if (this.mode !== 'editor') return;
      const marker = (e.target as HTMLElement).closest('.ci-video-hotspot-marker');
      if (marker) {
        e.stopPropagation();
        this.viewer?.pause();
      }
    }, true);

    // Click in placement mode
    this.videoAreaEl.addEventListener('click', (e: MouseEvent) => {
      if (this.mode !== 'editor' || !this._placementMode) return;
      const pos = this.getVideoPosition(e);
      if (!pos) return;
      this._placementMode = false;
      this.videoAreaEl.classList.remove('app-video-area--crosshair');
      this.updateAddBtnState();
      this.createHotspotAtPosition(pos.x, pos.y);
    });

    // Drag hotspot markers
    this.dragManager.setup();
  }

  // === Video helpers ===

  getVideoRect(): DOMRect | null {
    const wrapper = document.querySelector('.ci-video-hotspot-video-wrapper') as HTMLElement;
    if (wrapper) {
      const rect = wrapper.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return rect;
    }
    const container = document.querySelector('.ci-video-hotspot-container') as HTMLElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return rect;
    }
    return null;
  }

  private getVideoPosition(e: MouseEvent): { x: number; y: number } | null {
    const rect = this.getVideoRect();
    if (!rect) return null;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) return null;
    return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
  }

  // === Hotspot CRUD ===

  private createHotspotAtPosition(x: number, y: number): void {
    this.pushUndo();
    const currentTime = Math.round((this.viewer?.getCurrentTime() ?? 0) * 10) / 10;
    const endTime = Math.round(Math.min(currentTime + 10, this.videoDuration) * 10) / 10;
    const id = `hotspot-${this.nextId++}`;
    const xStr = `${x}%`;
    const yStr = `${y}%`;

    const newHotspot: VideoHotspotItem = {
      id,
      x: xStr,
      y: yStr,
      startTime: currentTime,
      endTime,
      label: `Hotspot ${this.nextId - 1}`,
      interpolation: 'catmull-rom',
      keyframes: [
        { time: currentTime, x: xStr, y: yStr },
        { time: endTime, x: xStr, y: yStr },
      ],
      data: {},
    };

    this.hotspots.push(newHotspot);
    this.viewer?.pause();
    this.viewer?.addHotspot({ ...newHotspot });
    this.selection.selectPoint(id, 0);
    this.refresh();
    this.notifyChange();
  }

  deleteHotspot(id: string): void {
    const h = this.hotspots.find(hs => hs.id === id);
    if (!confirm(`Delete "${h?.label || id}"?`)) return;
    this.pushUndo();
    this.hotspots = this.hotspots.filter(h => h.id !== id);
    if (this.selection.getSelectedHotspotId() === id) {
      this.selection.deselect();
    }
    this.viewer?.removeHotspot(id);
    this.selection.updateMarkerVisibility();
    this.refresh();
    this.notifyChange();
  }

  deleteKeyframe(hotspotId: string, kfIndex: number): void {
    const hotspot = this.hotspots.find(h => h.id === hotspotId);
    if (!hotspot?.keyframes || hotspot.keyframes.length <= 2) return;
    this.pushUndo();
    hotspot.keyframes.splice(kfIndex, 1);
    hotspot.startTime = hotspot.keyframes[0].time;
    hotspot.endTime = hotspot.keyframes[hotspot.keyframes.length - 1].time;
    hotspot.x = hotspot.keyframes[0].x;
    hotspot.y = hotspot.keyframes[0].y;
    const selectedIdx = this.selection.getSelectedPointIndex();
    if (selectedIdx !== null && selectedIdx >= hotspot.keyframes.length) {
      this.selection.setSelectedPointIndex(hotspot.keyframes.length - 1);
    }
    this.syncHotspot(hotspotId);
    this.notifyChange();
  }

  updateKeyframe(hotspotId: string, kfIndex: number, field: string, value: number): void {
    const hotspot = this.hotspots.find(h => h.id === hotspotId);
    if (!hotspot?.keyframes?.[kfIndex]) return;

    this.pushUndo();
    const kf = hotspot.keyframes[kfIndex];
    if (field === 'time') {
      kf.time = value;
      hotspot.keyframes.sort((a, b) => a.time - b.time);
      hotspot.startTime = hotspot.keyframes[0].time;
      hotspot.endTime = hotspot.keyframes[hotspot.keyframes.length - 1].time;
      this.selection.setSelectedPointIndex(hotspot.keyframes.indexOf(kf));
    } else if (field === 'x') {
      kf.x = `${value}%`;
    } else if (field === 'y') {
      kf.y = `${value}%`;
    }

    hotspot.x = hotspot.keyframes[0].x;
    hotspot.y = hotspot.keyframes[0].y;
    this.syncHotspot(hotspotId);
    this.notifyChange();
  }

  syncHotspot(id: string): void {
    const h = this.hotspots.find(hs => hs.id === id);
    if (!h || !this.viewer) return;
    this.viewer.updateHotspot(id, { ...h });
    this.selection.updateMarkerVisibility();
    this.refresh();
  }

  // === Public accessors ===

  getHotspots(): VideoHotspotItem[] {
    return this.hotspots;
  }

  getViewer(): CIVideoHotspot | null {
    return this.viewer;
  }

  getSelection(): SelectionManager {
    return this.selection;
  }

  getVideoAreaEl(): HTMLElement {
    return this.videoAreaEl;
  }

  getVideoDuration(): number {
    return this.videoDuration;
  }

  getGlobalTrigger(): TriggerMode {
    return this.globalTrigger;
  }

  getGlobalPauseOnInteract(): boolean {
    return this.globalPauseOnInteract;
  }

  getGlobalMarkerStyle(): MarkerStyle {
    return this.globalMarkerStyle;
  }

  isPlacementMode(): boolean {
    return this._placementMode;
  }

  // === Global settings mutators ===

  setGlobalTrigger(trigger: TriggerMode): void {
    this.globalTrigger = trigger;
    this.updateViewer();
    this.notifyChange();
  }

  setGlobalPauseOnInteract(value: boolean): void {
    this.globalPauseOnInteract = value;
    this.updateViewer();
    this.notifyChange();
  }

  setGlobalMarkerStyle(style: MarkerStyle): void {
    this.globalMarkerStyle = style;
    this.updateViewer(true);
    this.notifyChange();
  }

  // === Placement mode ===

  togglePlacementMode(): void {
    this._placementMode = !this._placementMode;
    this.videoAreaEl.classList.toggle('app-video-area--crosshair', this._placementMode);
    this.updateAddBtnState();
  }

  private updateAddBtnState(): void {
    const btn = this.sidebarEl.querySelector('.sidebar-add-btn') as HTMLElement | null;
    if (!btn) return;
    btn.classList.toggle('sidebar-add-btn--active', this._placementMode);
    btn.textContent = this._placementMode ? 'Click to place…' : '+ Add Hotspot';
  }

  // === Undo/Redo ===

  pushUndo(): void {
    this.undoManager.push();
  }

  restoreSnapshot(hotspots: VideoHotspotItem[]): void {
    this.hotspots = hotspots;
    this.selection.deselect();
    this.updateViewer(true);
    this.notifyChange();
  }

  // === Load / Import ===

  loadVideo(url: string): void {
    if (this.config.demoMode) return;
    this.config.src = url;
    this.seekAfterRebuild = null;
    this.hotspots = [];
    this.selection.deselect();
    this.nextId = 1;
    this.undoManager.clear();
    this._placementMode = false;

    this.toolbar.setLoadingState(true);

    // Show loading overlay
    let loadingOverlay = this.videoAreaEl.querySelector('.video-loading-overlay') as HTMLElement | null;
    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.className = 'video-loading-overlay';
      loadingOverlay.innerHTML = '<div class="video-loading-spinner"></div><div class="video-loading-text">Loading video…</div>';
      this.videoAreaEl.appendChild(loadingOverlay);
    }
    loadingOverlay.classList.add('video-loading-overlay--visible');

    this.rebuildViewer(true);
    this.notifyChange();

    const hideLoading = () => {
      loadingOverlay?.classList.remove('video-loading-overlay--visible');
      this.toolbar.setLoadingState(false);
      this.pendingLoadHide = null;
    };

    const loadTimeout = setTimeout(() => {
      this.pendingLoadHide = null;
      hideLoading();
      this.toolbar.showUrlError();
    }, 15000);

    this.pendingLoadHide = () => {
      clearTimeout(loadTimeout);
      hideLoading();
    };
  }

  importHotspots(data: VideoHotspotItem[]): void {
    this.pushUndo();
    this.hotspots = data;
    this.nextId = this.hotspots.length + 1;
    this.selection.deselect();
    this.updateViewer(true);
    this.notifyChange();
  }

  // === Card Editor ===

  openCardEditor(hotspotId: string): void {
    this.cardEditorManager.open(hotspotId);
  }

  // === Refresh ===

  refresh(): void {
    this.timelineManager.render();
    this.propertyPanel.render();
  }

  // === JSON / Change notification ===

  notifyChange(): void {
    this.config.onChange?.(this.hotspots);
  }

  exportJSON(): string {
    return JSON.stringify(this.hotspots, null, 2);
  }

  // === Keyboard Shortcuts ===

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          this.undoManager.redo();
        } else {
          this.undoManager.undo();
        }
        return;
      }

      switch (e.key) {
        case 'a':
        case 'A':
          if (this.mode !== 'editor') this.setMode('editor');
          this._placementMode = true;
          this.videoAreaEl.classList.add('app-video-area--crosshair');
          this.updateAddBtnState();
          break;

        case 'v':
        case 'V':
          if (this.mode !== 'editor') this.setMode('editor');
          this._placementMode = false;
          this.videoAreaEl.classList.remove('app-video-area--crosshair');
          this.updateAddBtnState();
          break;

        case 'Delete':
          if (this.mode === 'editor' && this.selection.getSelectedHotspotId()) {
            this.deleteHotspot(this.selection.getSelectedHotspotId()!);
          }
          break;

        case 'Escape':
          if (this._placementMode) {
            this._placementMode = false;
            this.videoAreaEl.classList.remove('app-video-area--crosshair');
            this.updateAddBtnState();
          } else if (this.selection.getSelectedHotspotId()) {
            this.selection.deselect();
            this.refresh();
          }
          break;
      }
    });

    // Capture phase handler — fires before the plugin's keyboard handler
    document.addEventListener('keydown', (e) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        if (this.viewer) this.viewer.togglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        if (this.viewer) this.viewer.seek(this.viewer.getCurrentTime() + 0.2);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        if (this.viewer) this.viewer.seek(Math.max(0, this.viewer.getCurrentTime() - 0.2));
      }
    }, true);
  }

  // === Destroy ===

  destroy(): void {
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
    this.editorMarkerObserver?.disconnect();
  }
}

// ── Sample Data ──

function getSampleHotspots(): VideoHotspotItem[] {
  return [
    {
      id: 'hotspot-4',
      x: '48.47%',
      y: '44.88%',
      startTime: 0.6,
      endTime: 14.7,
      label: 'Television',
      interpolation: 'catmull-rom' as const,
      keyframes: [
        { time: 0.6, x: '48.47%', y: '44.88%' },
        { time: 1.6, x: '49.94%', y: '44.88%' },
        { time: 2.3, x: '50.43%', y: '45.1%' },
        { time: 3, x: '51.16%', y: '44.23%' },
        { time: 4.5, x: '52.02%', y: '44.23%' },
        { time: 5.3, x: '51.16%', y: '44.01%' },
        { time: 6.2, x: '49.2%', y: '43.79%' },
        { time: 7.3, x: '48.1%', y: '44.01%' },
        { time: 9.4, x: '48.47%', y: '44.01%' },
        { time: 10.7, x: '47.61%', y: '44.66%' },
        { time: 12.2, x: '45.4%', y: '45.53%' },
        { time: 13.2, x: '45.53%', y: '45.32%' },
        { time: 14.7, x: '43.93%', y: '45.32%' },
      ],
      data: {
        title: 'Smart Television',
        price: '$899',
        originalPrice: '$1,199',
        badge: '-25%',
        description: 'Ultra HD smart TV with immersive sound and streaming built-in.',
        image: 'https://picsum.photos/320/180?random=10',
        ctaText: 'Shop Now',
      },
    },
    {
      id: 'hotspot-6',
      x: '36.95%',
      y: '73.2%',
      startTime: 2.2,
      endTime: 12.8,
      label: 'Pouf',
      interpolation: 'catmull-rom' as const,
      keyframes: [
        { time: 2.2, x: '36.95%', y: '73.2%' },
        { time: 4.1, x: '34.99%', y: '69.5%' },
        { time: 5.9, x: '28.86%', y: '67.97%' },
        { time: 7.2, x: '25.06%', y: '65.14%' },
        { time: 8.6, x: '23.84%', y: '61.66%' },
        { time: 9.3, x: '23.47%', y: '59.69%' },
        { time: 10.6, x: '22%', y: '57.73%' },
        { time: 11.7, x: '19.91%', y: '56.21%' },
        { time: 12.8, x: '21.14%', y: '53.16%' },
      ],
      data: {
        title: 'Knitted Pouf',
        price: '$79',
        description: 'Handcrafted knitted pouf — perfect as extra seating or a footrest.',
        image: 'https://picsum.photos/320/180?random=11',
        ctaText: 'Add to Cart',
      },
    },
    {
      id: 'hotspot-7',
      x: '74.2%',
      y: '30.94%',
      startTime: 5.5,
      endTime: 14.1,
      label: 'Fireplace',
      interpolation: 'catmull-rom' as const,
      keyframes: [
        { time: 5.5, x: '74.2%', y: '30.94%' },
        { time: 6, x: '73.59%', y: '30.72%' },
        { time: 6.6, x: '73.1%', y: '31.37%' },
        { time: 8.2, x: '76.41%', y: '32.46%' },
        { time: 9.6, x: '79.84%', y: '34.86%' },
        { time: 12.6, x: '81.19%', y: '42.05%' },
        { time: 14.1, x: '80.02%', y: '46%' },
      ],
      data: {
        title: 'Electric Fireplace',
        price: '$349',
        originalPrice: '$499',
        badge: '-30%',
        description: 'Modern electric fireplace with realistic flame effect and remote control.',
        image: 'https://picsum.photos/320/180?random=12',
        ctaText: 'Shop Now',
      },
    },
  ];
}
