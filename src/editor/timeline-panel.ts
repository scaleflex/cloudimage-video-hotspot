import { createElement } from '../utils/dom';
import { addListener } from '../utils/events';
import type { CIVideoHotspotEditor } from './ci-video-hotspot-editor';

export class TimelinePanel {
  private containerEl: HTMLElement;
  private rulerEl: HTMLElement;
  private tracksEl: HTMLElement;
  private playheadEl: HTMLElement;
  private cleanups: (() => void)[] = [];
  private duration = 0;
  private currentTime = 0;
  private draggingPlayhead = false;
  private draggingEdge: { id: string; edge: 'start' | 'end' } | null = null;

  constructor(
    parentEl: HTMLElement,
    private editor: CIVideoHotspotEditor,
  ) {
    this.containerEl = createElement('div', 'ci-editor-timeline');
    this.rulerEl = createElement('div', 'ci-editor-timeline-ruler');
    this.tracksEl = createElement('div', 'ci-editor-timeline-tracks');
    this.playheadEl = createElement('div', 'ci-editor-timeline-playhead');

    this.containerEl.appendChild(this.rulerEl);
    this.containerEl.appendChild(this.tracksEl);
    this.containerEl.appendChild(this.playheadEl);
    parentEl.appendChild(this.containerEl);

    this.bindEvents();
  }

  private bindEvents(): void {
    // Click on ruler to seek
    const rulerClick = addListener(this.rulerEl, 'click', (e) => {
      if (this.duration <= 0) return;
      const rect = this.rulerEl.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const time = Math.max(0, Math.min(this.duration, ratio * this.duration));
      this.editor.seekVideo(time);
    });
    this.cleanups.push(rulerClick);

    // Click on empty track area to seek
    const tracksClick = addListener(this.tracksEl, 'click', (e) => {
      if (this.duration <= 0) return;
      if ((e.target as HTMLElement).closest('.ci-editor-timeline-track')) return;
      const rect = this.tracksEl.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const time = Math.max(0, Math.min(this.duration, ratio * this.duration));
      this.editor.seekVideo(time);
    });
    this.cleanups.push(tracksClick);

    // Playhead dragging
    const playheadDown = addListener(this.playheadEl, 'pointerdown', (e) => {
      e.preventDefault();
      this.draggingPlayhead = true;
      this.playheadEl.setPointerCapture(e.pointerId);
    });
    this.cleanups.push(playheadDown);

    const containerMove = addListener(this.containerEl, 'pointermove', (e) => {
      if (!this.draggingPlayhead && !this.draggingEdge) return;
      if (this.duration <= 0) return;

      const rect = this.tracksEl.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const time = ratio * this.duration;

      if (this.draggingPlayhead) {
        this.editor.seekVideo(time);
      } else if (this.draggingEdge) {
        const { id, edge } = this.draggingEdge;
        const hotspot = this.editor.getHotspot(id);
        if (!hotspot) return;
        const rounded = Math.round(time * 10) / 10;
        if (edge === 'start' && rounded < hotspot.endTime) {
          this.editor.updateHotspot(id, { startTime: Math.max(0, rounded) });
        } else if (edge === 'end' && rounded > hotspot.startTime) {
          this.editor.updateHotspot(id, { endTime: Math.min(this.duration, rounded) });
        }
      }
    });
    this.cleanups.push(containerMove);

    const containerUp = addListener(this.containerEl, 'pointerup', () => {
      this.draggingPlayhead = false;
      this.draggingEdge = null;
    });
    this.cleanups.push(containerUp);
  }

  setDuration(duration: number): void {
    if (duration === this.duration) return;
    this.duration = duration;
    this.renderRuler();
    this.render();
  }

  setCurrentTime(time: number): void {
    this.currentTime = time;
    this.updatePlayhead();
  }

  render(): void {
    this.tracksEl.innerHTML = '';
    if (this.duration <= 0) return;

    const hotspots = this.editor.getHotspots();
    const selectedId = this.editor.getSelection().getSelectedId();

    hotspots.forEach((h, i) => {
      const left = (h.startTime / this.duration) * 100;
      const width = ((h.endTime - h.startTime) / this.duration) * 100;

      const track = createElement('div', 'ci-editor-timeline-track');
      track.style.left = `${left}%`;
      track.style.width = `${Math.max(0.5, width)}%`;
      track.style.top = `${i * 28 + 4}px`;
      track.textContent = h.label || h.id;
      track.title = `${h.label || h.id} (${h.startTime}s – ${h.endTime}s)`;

      if (h.id === selectedId) {
        track.classList.add('ci-editor-timeline-track--selected');
      }

      // Click to select
      track.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editor.getSelection().select(h.id);
      });

      // Drag handles for start/end edges
      const startHandle = createElement('div', 'ci-editor-timeline-handle ci-editor-timeline-handle--start');
      const endHandle = createElement('div', 'ci-editor-timeline-handle ci-editor-timeline-handle--end');

      startHandle.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.draggingEdge = { id: h.id, edge: 'start' };
      });

      endHandle.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.draggingEdge = { id: h.id, edge: 'end' };
      });

      track.appendChild(startHandle);
      track.appendChild(endHandle);
      this.tracksEl.appendChild(track);
    });

    // Adjust container height
    const trackCount = hotspots.length;
    const minHeight = Math.max(60, trackCount * 28 + 8);
    this.tracksEl.style.minHeight = `${minHeight}px`;

    this.updatePlayhead();
  }

  private renderRuler(): void {
    this.rulerEl.innerHTML = '';
    if (this.duration <= 0) return;

    let interval = 5;
    if (this.duration > 120) interval = 30;
    else if (this.duration > 60) interval = 15;
    else if (this.duration > 30) interval = 10;

    for (let t = 0; t <= this.duration; t += interval) {
      const tick = createElement('span', 'ci-editor-timeline-tick');
      tick.style.left = `${(t / this.duration) * 100}%`;
      tick.textContent = this.formatTime(t);
      this.rulerEl.appendChild(tick);
    }
  }

  private updatePlayhead(): void {
    if (this.duration <= 0) {
      this.playheadEl.style.left = '0%';
      return;
    }
    const pct = (this.currentTime / this.duration) * 100;
    this.playheadEl.style.left = `${Math.min(100, Math.max(0, pct))}%`;
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  destroy(): void {
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    this.containerEl.remove();
  }
}
