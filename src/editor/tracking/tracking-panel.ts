import { createElement } from '../../utils/dom';
import type { TrackingState, TrackingRegion, TrackingOptions, TrackingProgress, TrackingResult, DEFAULT_TRACKING_OPTIONS } from './types';

export interface TrackingPanelCallbacks {
  onTrackObject: () => void;
  onStartTracking: (options: TrackingOptions) => void;
  onCancel: () => void;
  onApply: (results: TrackingResult[]) => void;
  onPreview: (results: TrackingResult[]) => void;
  onRetrack: () => void;
  onDiscard: () => void;
  canTrack: () => boolean;
  hasSelection: () => boolean;
  getVideoDuration: () => number;
  getVideoCurrentTime: () => number;
}

/**
 * Sidebar panel for managing object tracking operations.
 */
export class TrackingPanel {
  private panelEl: HTMLElement;
  private contentEl: HTMLElement;
  private state: TrackingState = 'idle';
  private region: TrackingRegion | null = null;
  private results: TrackingResult[] | null = null;
  private simplifiedCount = 0;
  private avgConfidence = 0;

  // Config inputs
  private fpsInput: HTMLInputElement | null = null;
  private startTimeInput: HTMLInputElement | null = null;
  private endTimeInput: HTMLInputElement | null = null;
  private confidenceInput: HTMLInputElement | null = null;

  constructor(
    private parentEl: HTMLElement,
    private callbacks: TrackingPanelCallbacks,
  ) {
    this.panelEl = createElement('div', 'ci-editor-tracking-panel');
    this.contentEl = createElement('div', 'ci-editor-tracking-content');
    this.panelEl.appendChild(this.contentEl);
    this.parentEl.appendChild(this.panelEl);
    this.render();
  }

  setState(state: TrackingState): void {
    this.state = state;
    this.render();
  }

  setRegion(region: TrackingRegion): void {
    this.region = region;
    this.setState('configuring');
  }

  setResults(results: TrackingResult[], simplifiedCount: number): void {
    this.results = results;
    this.simplifiedCount = simplifiedCount;
    this.avgConfidence = results.length > 0
      ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
      : 0;
    this.setState('complete');
  }

  setError(message: string): void {
    this.state = 'error';
    this.renderError(message);
  }

  updateProgress(progress: TrackingProgress): void {
    const bar = this.contentEl.querySelector<HTMLElement>('.ci-tracking-progress-fill');
    const text = this.contentEl.querySelector<HTMLElement>('.ci-tracking-progress-text');
    const conf = this.contentEl.querySelector<HTMLElement>('.ci-tracking-confidence');

    if (bar) bar.style.width = `${progress.percent}%`;
    if (text) text.textContent = `${progress.currentFrame}/${progress.totalFrames} frames (${Math.round(progress.percent)}%)`;
    if (conf) conf.textContent = `Confidence: ${(progress.confidence * 100).toFixed(0)}%`;
  }

  private render(): void {
    this.contentEl.innerHTML = '';

    const title = createElement('div', 'ci-editor-tracking-title');
    title.textContent = 'Object Tracking';
    this.contentEl.appendChild(title);

    switch (this.state) {
      case 'idle': this.renderIdle(); break;
      case 'selecting': this.renderSelecting(); break;
      case 'configuring': this.renderConfiguring(); break;
      case 'tracking': this.renderTracking(); break;
      case 'complete': this.renderComplete(); break;
      case 'error': this.renderError('An error occurred'); break;
    }
  }

  private renderIdle(): void {
    const desc = createElement('p', 'ci-editor-tracking-desc');
    desc.textContent = 'Select a hotspot, then click "Track Object" to bind it to a video object.';
    this.contentEl.appendChild(desc);

    const btn = this.createButton('Track Object', 'ci-editor-btn ci-editor-btn--primary', () => {
      this.callbacks.onTrackObject();
    });
    btn.disabled = !this.callbacks.canTrack() || !this.callbacks.hasSelection();

    if (!this.callbacks.canTrack()) {
      const warning = createElement('p', 'ci-editor-tracking-warning');
      warning.textContent = 'Auto-tracking requires HTML5 video with CORS access.';
      this.contentEl.appendChild(warning);
    }

    this.contentEl.appendChild(btn);
  }

  private renderSelecting(): void {
    const desc = createElement('p', 'ci-editor-tracking-desc');
    desc.textContent = 'Draw a rectangle around the object you want to track.';
    this.contentEl.appendChild(desc);

    this.contentEl.appendChild(
      this.createButton('Cancel', 'ci-editor-btn', () => this.callbacks.onCancel()),
    );
  }

  private renderConfiguring(): void {
    if (!this.region) return;

    const info = createElement('p', 'ci-editor-tracking-desc');
    info.textContent = `Region: ${this.region.width}x${this.region.height} px`;
    this.contentEl.appendChild(info);

    const duration = this.callbacks.getVideoDuration();
    const currentTime = this.callbacks.getVideoCurrentTime();

    // Time range
    const timeGroup = createElement('div', 'ci-editor-tracking-field-group');

    this.startTimeInput = this.createNumberInput('Start (s)', currentTime, 0, duration, 0.1);
    this.endTimeInput = this.createNumberInput('End (s)', Math.min(currentTime + 10, duration), 0, duration, 0.1);
    timeGroup.appendChild(this.startTimeInput.parentElement!);
    timeGroup.appendChild(this.endTimeInput.parentElement!);
    this.contentEl.appendChild(timeGroup);

    // FPS
    this.fpsInput = this.createNumberInput('Sample FPS', 5, 1, 30, 1);
    this.contentEl.appendChild(this.fpsInput.parentElement!);

    // Confidence threshold
    this.confidenceInput = this.createNumberInput('Min Confidence', 0.4, 0.1, 1.0, 0.1);
    this.contentEl.appendChild(this.confidenceInput.parentElement!);

    // Estimated frames
    const estFrames = Math.ceil(
      (parseFloat(this.endTimeInput.value) - parseFloat(this.startTimeInput.value))
      * parseFloat(this.fpsInput.value),
    );
    const est = createElement('p', 'ci-editor-tracking-desc');
    est.textContent = `Est. frames: ~${estFrames}`;
    this.contentEl.appendChild(est);

    // Buttons
    const actions = createElement('div', 'ci-editor-tracking-actions');
    actions.appendChild(
      this.createButton('Start Tracking', 'ci-editor-btn ci-editor-btn--primary', () => {
        this.callbacks.onStartTracking({
          startTime: parseFloat(this.startTimeInput!.value),
          endTime: parseFloat(this.endTimeInput!.value),
          fps: parseInt(this.fpsInput!.value, 10),
          searchRadius: 2.0,
          confidenceThreshold: parseFloat(this.confidenceInput!.value),
        });
      }),
    );
    actions.appendChild(
      this.createButton('Cancel', 'ci-editor-btn', () => this.callbacks.onCancel()),
    );
    this.contentEl.appendChild(actions);
  }

  private renderTracking(): void {
    const desc = createElement('p', 'ci-editor-tracking-desc');
    desc.textContent = 'Tracking in progress...';
    this.contentEl.appendChild(desc);

    // Progress bar
    const progressWrap = createElement('div', 'ci-tracking-progress');
    const progressFill = createElement('div', 'ci-tracking-progress-fill');
    progressWrap.appendChild(progressFill);
    this.contentEl.appendChild(progressWrap);

    const progressText = createElement('p', 'ci-tracking-progress-text');
    progressText.textContent = '0/0 frames (0%)';
    this.contentEl.appendChild(progressText);

    const confText = createElement('p', 'ci-tracking-confidence');
    confText.textContent = 'Confidence: --';
    this.contentEl.appendChild(confText);

    this.contentEl.appendChild(
      this.createButton('Cancel', 'ci-editor-btn', () => this.callbacks.onCancel()),
    );
  }

  private renderComplete(): void {
    if (!this.results) return;

    const status = createElement('p', 'ci-editor-tracking-desc ci-editor-tracking-success');
    status.textContent = 'Tracking complete!';
    this.contentEl.appendChild(status);

    const stats = createElement('div', 'ci-editor-tracking-stats');
    stats.innerHTML = [
      `<div>Keyframes: ${this.results.length} raw, ${this.simplifiedCount} simplified</div>`,
      `<div>Avg confidence: ${(this.avgConfidence * 100).toFixed(0)}%</div>`,
      `<div>Duration: ${this.results[0]?.time.toFixed(1)}s - ${this.results[this.results.length - 1]?.time.toFixed(1)}s</div>`,
    ].join('');
    this.contentEl.appendChild(stats);

    const actions = createElement('div', 'ci-editor-tracking-actions');
    actions.appendChild(
      this.createButton('Apply', 'ci-editor-btn ci-editor-btn--primary', () => {
        this.callbacks.onApply(this.results!);
      }),
    );
    actions.appendChild(
      this.createButton('Preview', 'ci-editor-btn', () => {
        this.callbacks.onPreview(this.results!);
      }),
    );
    actions.appendChild(
      this.createButton('Re-track', 'ci-editor-btn', () => this.callbacks.onRetrack()),
    );
    actions.appendChild(
      this.createButton('Discard', 'ci-editor-btn', () => this.callbacks.onDiscard()),
    );
    this.contentEl.appendChild(actions);
  }

  private renderError(message: string): void {
    this.contentEl.innerHTML = '';

    const title = createElement('div', 'ci-editor-tracking-title');
    title.textContent = 'Object Tracking';
    this.contentEl.appendChild(title);

    const errMsg = createElement('p', 'ci-editor-tracking-desc ci-editor-tracking-error');
    errMsg.textContent = message;
    this.contentEl.appendChild(errMsg);

    const actions = createElement('div', 'ci-editor-tracking-actions');
    actions.appendChild(
      this.createButton('Retry', 'ci-editor-btn', () => this.callbacks.onRetrack()),
    );
    actions.appendChild(
      this.createButton('Close', 'ci-editor-btn', () => this.callbacks.onCancel()),
    );
    this.contentEl.appendChild(actions);
  }

  private createButton(label: string, className: string, onClick: () => void): HTMLButtonElement {
    const btn = createElement('button', className) as HTMLButtonElement;
    btn.textContent = label;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  private createNumberInput(
    label: string,
    defaultValue: number,
    min: number,
    max: number,
    step: number,
  ): HTMLInputElement {
    const wrap = createElement('div', 'ci-editor-tracking-field');
    const lbl = createElement('label', 'ci-editor-tracking-label');
    lbl.textContent = label;
    const input = createElement('input', 'ci-editor-tracking-input') as HTMLInputElement;
    input.type = 'number';
    input.value = String(defaultValue);
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    wrap.appendChild(lbl);
    wrap.appendChild(input);
    return input;
  }

  destroy(): void {
    this.panelEl.remove();
  }
}
