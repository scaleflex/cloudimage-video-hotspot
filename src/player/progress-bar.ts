import { createElement, addClass, removeClass } from '../utils/dom';
import { addListener } from '../utils/events';
import { formatTime } from '../utils/time';
import type { TimelineIndicatorStyle, VideoChapter } from '../core/types';

export interface ProgressBarOptions {
  onSeek: (time: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  /** Called continuously while dragging so the video can seek in real-time. */
  onScrub?: (time: number) => void;
  getDuration: () => number;
  getCurrentTime: () => number;
  getBufferedEnd: () => number;
  timelineIndicators: TimelineIndicatorStyle;
  chapters?: VideoChapter[];
  hotspotRanges?: Array<{ id: string; startTime: number; endTime: number; label: string }>;
  onIndicatorClick?: (hotspotId: string) => void;
}

export class ProgressBar {
  readonly element: HTMLElement;
  private barEl: HTMLElement;
  private fillEl: HTMLElement;
  private bufferedEl: HTMLElement;
  private handleEl: HTMLElement;
  private tooltipEl: HTMLElement;
  private indicatorsEl: HTMLElement;
  private chaptersEl: HTMLElement;
  private cleanups: (() => void)[] = [];
  private indicatorCleanups: (() => void)[] = [];
  private isDragging = false;
  private dragTime: number | null = null;
  private lastScrubCall = 0;
  private options: ProgressBarOptions;

  constructor(options: ProgressBarOptions) {
    this.options = options;

    this.element = createElement('div', 'ci-video-hotspot-progress');

    this.barEl = createElement('div', 'ci-video-hotspot-progress-bar');
    this.bufferedEl = createElement('div', 'ci-video-hotspot-progress-buffered');
    this.fillEl = createElement('div', 'ci-video-hotspot-progress-fill');
    this.handleEl = createElement('div', 'ci-video-hotspot-progress-handle');
    this.tooltipEl = createElement('div', 'ci-video-hotspot-progress-tooltip');
    this.indicatorsEl = createElement('div', 'ci-video-hotspot-progress-indicators');
    this.chaptersEl = createElement('div', 'ci-video-hotspot-progress-chapters');

    this.barEl.appendChild(this.bufferedEl);
    this.barEl.appendChild(this.fillEl);
    this.barEl.appendChild(this.handleEl);
    this.barEl.appendChild(this.indicatorsEl);
    this.barEl.appendChild(this.chaptersEl);

    this.element.appendChild(this.barEl);
    this.element.appendChild(this.tooltipEl);

    // ARIA
    this.barEl.setAttribute('role', 'slider');
    this.barEl.setAttribute('aria-label', 'Video progress');
    this.barEl.setAttribute('aria-valuemin', '0');
    this.barEl.setAttribute('aria-valuemax', '100');
    this.barEl.setAttribute('aria-valuenow', '0');
    this.barEl.setAttribute('tabindex', '0');

    this.bindEvents();
    this.renderIndicators();
    this.renderChapters();
  }

  private bindEvents(): void {
    // Click to seek
    this.cleanups.push(addListener(this.barEl, 'mousedown', (e) => {
      e.preventDefault();
      this.startDrag();
      this.previewFromEvent(e);
    }));

    // Allow dragging from handle element
    this.cleanups.push(addListener(this.handleEl, 'mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.startDrag();
    }));

    this.cleanups.push(addListener(document, 'mousemove', (e) => {
      if (!this.isDragging) return;
      this.previewFromEvent(e);
      this.updateTooltip(e);
    }));

    this.cleanups.push(addListener(document, 'mouseup', () => {
      if (this.isDragging) {
        this.commitDrag();
        removeClass(this.element, 'ci-video-hotspot-progress--dragging');
        removeClass(this.tooltipEl, 'ci-video-hotspot-progress-tooltip--visible');
      }
    }));

    // Tooltip on hover
    this.cleanups.push(addListener(this.barEl, 'mousemove', (e) => {
      if (this.isDragging) return;
      this.updateTooltip(e);
    }));

    this.cleanups.push(addListener(this.barEl, 'mouseleave', () => {
      if (!this.isDragging) {
        removeClass(this.tooltipEl, 'ci-video-hotspot-progress-tooltip--visible');
      }
    }));

    // Touch support
    this.cleanups.push(addListener(this.barEl, 'touchstart', (e) => {
      e.preventDefault();
      this.startDrag();
      this.previewFromTouch(e);
    }));

    this.cleanups.push(addListener(document, 'touchmove', (e) => {
      if (!this.isDragging) return;
      this.previewFromTouch(e);
    }));

    this.cleanups.push(addListener(document, 'touchend', () => {
      if (this.isDragging) {
        this.commitDrag();
      }
    }));

    // Keyboard seek on progress bar
    this.cleanups.push(addListener(this.barEl, 'keydown', (e) => {
      const duration = this.options.getDuration();
      const current = this.options.getCurrentTime();
      const step = 5;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.options.onSeek(Math.min(duration, current + step));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.options.onSeek(Math.max(0, current - step));
      }
    }));
  }

  private startDrag(): void {
    this.isDragging = true;
    addClass(this.element, 'ci-video-hotspot-progress--dragging');
    this.options.onDragStart?.();
  }

  /** Update only the visual position of the progress bar during drag (no seek). */
  private previewFromEvent(e: MouseEvent): void {
    const percent = this.getPercentFromEvent(e);
    const duration = this.options.getDuration();
    this.dragTime = (percent / 100) * duration;
    this.update(this.dragTime);
    this.throttledScrub(this.dragTime);
  }

  private previewFromTouch(e: TouchEvent): void {
    if (e.touches.length === 0) return;
    const rect = this.barEl.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const duration = this.options.getDuration();
    this.dragTime = (percent / 100) * duration;
    this.update(this.dragTime);
    this.throttledScrub(this.dragTime);
  }

  /** Throttle scrub calls to avoid flooding iframe-based players (YouTube). */
  private throttledScrub(time: number): void {
    const now = Date.now();
    if (now - this.lastScrubCall >= 100) {
      this.lastScrubCall = now;
      this.options.onScrub?.(time);
    }
  }

  /** Send the actual seek when drag ends. */
  private commitDrag(): void {
    this.isDragging = false;
    if (this.dragTime !== null) {
      this.options.onSeek(this.dragTime);
      this.dragTime = null;
    }
    this.options.onDragEnd?.();
  }

  private updateTooltip(e: MouseEvent): void {
    const percent = this.getPercentFromEvent(e);
    const duration = this.options.getDuration();
    const time = (percent / 100) * duration;
    this.tooltipEl.textContent = formatTime(time);
    this.tooltipEl.style.left = `${percent}%`;

    // Clamp tooltip so it doesn't overflow the bar edges
    const barWidth = this.barEl.offsetWidth;
    const tooltipWidth = this.tooltipEl.offsetWidth;
    const halfTooltip = tooltipWidth / 2;
    const positionPx = (percent / 100) * barWidth;

    if (positionPx < halfTooltip) {
      this.tooltipEl.style.transform = 'translateX(0)';
      this.tooltipEl.style.left = '0';
    } else if (positionPx > barWidth - halfTooltip) {
      this.tooltipEl.style.transform = 'translateX(0)';
      this.tooltipEl.style.left = 'auto';
      this.tooltipEl.style.right = '0';
    } else {
      this.tooltipEl.style.transform = 'translateX(-50%)';
      this.tooltipEl.style.right = '';
    }

    addClass(this.tooltipEl, 'ci-video-hotspot-progress-tooltip--visible');
  }

  private getPercentFromEvent(e: MouseEvent): number {
    const rect = this.barEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    return Math.max(0, Math.min(100, (x / rect.width) * 100));
  }

  /** Render hotspot indicators on the timeline */
  renderIndicators(): void {
    // Clean up previous indicator listeners
    this.indicatorCleanups.forEach((fn) => fn());
    this.indicatorCleanups = [];
    this.indicatorsEl.innerHTML = '';

    const ranges = this.options.hotspotRanges;
    if (!ranges || this.options.timelineIndicators === 'none') return;

    const duration = this.options.getDuration();
    if (!duration) return;

    for (const range of ranges) {
      const left = (range.startTime / duration) * 100;

      if (this.options.timelineIndicators === 'range') {
        const width = ((range.endTime - range.startTime) / duration) * 100;
        const indicator = createElement('div', 'ci-video-hotspot-progress-indicator ci-video-hotspot-progress-indicator--range');
        indicator.style.left = `${left}%`;
        indicator.style.width = `${width}%`;
        indicator.setAttribute('aria-label', `Hotspot: ${range.label} at ${formatTime(range.startTime)}`);
        indicator.dataset.hotspotId = range.id;
        if (this.options.onIndicatorClick) {
          indicator.style.cursor = 'pointer';
          const cleanup = addListener(indicator, 'click', (e) => {
            e.stopPropagation();
            this.options.onIndicatorClick!(range.id);
          });
          this.indicatorCleanups.push(cleanup);
        }
        this.indicatorsEl.appendChild(indicator);
      } else {
        // dot style
        const indicator = createElement('button', 'ci-video-hotspot-progress-indicator', {
          'aria-label': `Hotspot: ${range.label} at ${formatTime(range.startTime)}`,
          'type': 'button',
        });
        indicator.style.left = `${left}%`;
        indicator.dataset.hotspotId = range.id;
        if (this.options.onIndicatorClick) {
          const cleanup = addListener(indicator, 'click', (e) => {
            e.stopPropagation();
            this.options.onIndicatorClick!(range.id);
          });
          this.indicatorCleanups.push(cleanup);
        }
        this.indicatorsEl.appendChild(indicator);
      }
    }
  }

  /** Render chapter markers on the timeline */
  renderChapters(): void {
    this.chaptersEl.innerHTML = '';
    const chapters = this.options.chapters;
    if (!chapters || chapters.length === 0) return;

    const duration = this.options.getDuration();
    if (!duration) return;

    for (const chapter of chapters) {
      if (chapter.startTime === 0) continue; // don't show divider at start
      const left = (chapter.startTime / duration) * 100;
      const marker = createElement('div', 'ci-video-hotspot-progress-chapter');
      marker.style.left = `${left}%`;
      marker.title = chapter.title;
      this.chaptersEl.appendChild(marker);
    }
  }

  /** Update the progress bar fill and handle position */
  update(currentTime: number): void {
    // While the user is dragging, don't let external updates overwrite the
    // visual position — the bar should stay where the user's pointer is.
    if (this.isDragging && this.dragTime !== null) {
      currentTime = this.dragTime;
    }

    const duration = this.options.getDuration();
    if (!duration) return;

    const percent = (currentTime / duration) * 100;
    this.fillEl.style.width = `${percent}%`;
    this.handleEl.style.left = `${percent}%`;

    // Update buffered
    const bufferedEnd = this.options.getBufferedEnd();
    const bufferedPercent = (bufferedEnd / duration) * 100;
    this.bufferedEl.style.width = `${bufferedPercent}%`;

    // ARIA
    this.barEl.setAttribute('aria-valuenow', String(Math.round(percent)));
    this.barEl.setAttribute('aria-valuetext', `${formatTime(currentTime)} of ${formatTime(duration)}`);
  }

  /** Update hotspot ranges (when hotspots change dynamically) */
  updateRanges(ranges: Array<{ id: string; startTime: number; endTime: number; label: string }>): void {
    this.options.hotspotRanges = ranges;
    this.renderIndicators();
  }

  destroy(): void {
    this.indicatorCleanups.forEach((fn) => fn());
    this.indicatorCleanups = [];
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    this.element.remove();
  }
}
