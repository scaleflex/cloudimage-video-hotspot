import type { VideoHotspotItem } from '../core/types';
import type { CIVideoHotspotEditor } from './ci-video-hotspot-editor';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#06b6d4', '#f97316', '#a855f7'];

export class TimelineManager {
  private editor: CIVideoHotspotEditor;

  constructor(editor: CIVideoHotspotEditor) {
    this.editor = editor;
  }

  render(): void {
    const bar = document.querySelector('.ci-video-hotspot-progress-bar') as HTMLElement | null;
    if (!bar) return;

    let track = bar.querySelector('.demo-kf-track') as HTMLElement | null;
    if (!track) {
      track = el('div', 'demo-kf-track');
      bar.appendChild(track);
    }
    track.innerHTML = '';

    if (this.editor.getMode() === 'view') {
      this.renderViewDots(track);
    } else {
      this.renderEditorDots(track);
    }
  }

  private renderViewDots(track: HTMLElement): void {
    const hotspots = this.editor.getHotspots();
    const duration = this.editor.getVideoDuration();
    hotspots.forEach((h, hIdx) => {
      const dot = el('div', 'timeline-start-dot');
      dot.style.left = `${(h.startTime / duration) * 100}%`;
      dot.style.backgroundColor = COLORS[hIdx % COLORS.length];
      dot.title = h.label;
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editor.getViewer()?.goToHotspot(h.id);
      });
      track.appendChild(dot);
    });
  }

  private renderEditorDots(track: HTMLElement): void {
    const hotspots = this.editor.getHotspots();
    const duration = this.editor.getVideoDuration();
    const selection = this.editor.getSelection();
    const selectedHotspotId = selection.getSelectedHotspotId();
    const selectedPointIndex = selection.getSelectedPointIndex();

    hotspots.forEach((h, hIdx) => {
      const color = COLORS[hIdx % COLORS.length];
      const isSelected = h.id === selectedHotspotId;
      const kfs = h.keyframes || [];

      if (selectedHotspotId && !isSelected) return;

      if (!selectedHotspotId) {
        if (kfs.length > 0) {
          const dot = el('div', 'timeline-kf-dot');
          dot.style.left = `${(kfs[0].time / duration) * 100}%`;
          dot.style.backgroundColor = color;
          dot.title = `${h.label} (${fmtTime(kfs[0].time)})`;
          dot.addEventListener('click', (e) => {
            e.stopPropagation();
            selection.selectPoint(h.id, 0);
            this.editor.refresh();
          });
          track.appendChild(dot);
        }
        return;
      }

      // Selected hotspot — show all keyframes with connecting line
      if (kfs.length > 1) {
        const line = el('div', 'timeline-kf-line');
        const startPct = (kfs[0].time / duration) * 100;
        const endPct = (kfs[kfs.length - 1].time / duration) * 100;
        line.style.left = `${startPct}%`;
        line.style.width = `${endPct - startPct}%`;
        line.style.backgroundColor = color;
        track.appendChild(line);
      }

      kfs.forEach((kf, kfIdx) => {
        const dot = el('div', 'timeline-kf-dot');
        dot.style.left = `${(kf.time / duration) * 100}%`;
        dot.style.backgroundColor = color;

        if (kfIdx === selectedPointIndex) {
          dot.classList.add('timeline-kf-dot--selected');
        } else {
          dot.classList.add('timeline-kf-dot--secondary');
        }

        dot.title = `${h.label} P${kfIdx + 1} (${fmtTime(kf.time)})`;

        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          selection.selectPoint(h.id, kfIdx);
          this.editor.refresh();
        });

        this.makeTimelineDotDraggable(dot, h, kfIdx);
        track.appendChild(dot);
      });
    });
  }

  private makeTimelineDotDraggable(dot: HTMLElement, hotspot: VideoHotspotItem, kfIdx: number): void {
    let pointerDown = false;
    let isDragging = false;
    let startX = 0;
    const duration = this.editor.getVideoDuration();
    const selection = this.editor.getSelection();

    dot.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      pointerDown = true;
      isDragging = false;
      startX = e.clientX;
      dot.setPointerCapture(e.pointerId);
      selection.select(hotspot.id, kfIdx);
    });

    dot.addEventListener('pointermove', (e) => {
      if (!pointerDown) return;
      if (!isDragging && Math.abs(e.clientX - startX) < 3) return;
      isDragging = true;
      const track = dot.parentElement!;
      const rect = track.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      dot.style.left = `${pct * 100}%`;
      this.editor.getViewer()?.seek(pct * duration);
    });

    dot.addEventListener('pointerup', (e) => {
      if (!pointerDown) return;
      pointerDown = false;
      if (!isDragging) {
        isDragging = false;
        return;
      }
      isDragging = false;

      const track = dot.parentElement!;
      const rect = track.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = Math.round(pct * duration * 10) / 10;

      const kf = hotspot.keyframes?.[kfIdx];
      if (kf) {
        this.editor.pushUndo();
        kf.time = newTime;
        hotspot.keyframes!.sort((a, b) => a.time - b.time);
        hotspot.startTime = hotspot.keyframes![0].time;
        hotspot.endTime = hotspot.keyframes![hotspot.keyframes!.length - 1].time;
        hotspot.x = hotspot.keyframes![0].x;
        hotspot.y = hotspot.keyframes![0].y;
        selection.setSelectedPointIndex(hotspot.keyframes!.indexOf(kf));
      }
      this.editor.syncHotspot(hotspot.id);
      this.editor.notifyChange();
    });
  }
}

function el(tag: string, className?: string): HTMLElement {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
