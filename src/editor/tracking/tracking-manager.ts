import type { CIVideoHotspotEditor } from '../ci-video-hotspot-editor';
import type { TrackingRegion, TrackingOptions, TrackingResult, TrackingMetadata } from './types';
import { DEFAULT_TRACKING_OPTIONS } from './types';
import { FrameExtractor } from './frame-extractor';
import { CombinedTracker } from './combined-tracker';
import { RegionSelector } from './region-selector';
import { TrackingPanel } from './tracking-panel';
import { trackingResultsToKeyframes, simplifyKeyframes, toHotspotKeyframes } from './keyframe-generator';

/**
 * Central orchestrator for object tracking in the editor.
 */
export class TrackingManager {
  private panel: TrackingPanel;
  private regionSelector: RegionSelector | null = null;
  private extractor: FrameExtractor | null = null;
  private tracker: CombinedTracker | null = null;
  private selectedRegion: TrackingRegion | null = null;
  private lastResults: TrackingResult[] | null = null;

  constructor(private editor: CIVideoHotspotEditor) {
    this.panel = new TrackingPanel(
      (this.editor as any).sidebarEl,
      {
        onTrackObject: () => this.startRegionSelection(),
        onStartTracking: (opts) => this.startTracking(opts),
        onCancel: () => this.cancel(),
        onApply: (results) => this.applyResults(results),
        onPreview: (results) => this.previewResults(results),
        onRetrack: () => this.startRegionSelection(),
        onDiscard: () => this.discard(),
        canTrack: () => this.canTrack(),
        hasSelection: () => !!this.editor.getSelection().getSelectedId(),
        getVideoDuration: () => this.editor.getVideoDuration(),
        getVideoCurrentTime: () => this.editor.getVideoCurrentTime(),
      },
    );
  }

  /** Check if browser tracking is available */
  canTrack(): boolean {
    const videoEl = this.getVideoElement();
    if (!videoEl) return false;

    // CORS check
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(videoEl, 0, 0, 1, 1);
      ctx.getImageData(0, 0, 1, 1);
      return true;
    } catch {
      return false;
    }
  }

  /** Start region selection — user draws a bounding box */
  startRegionSelection(): void {
    const videoEl = this.getVideoElement();
    if (!videoEl) {
      this.panel.setError('Auto-tracking works only with HTML5 video (not YouTube/Vimeo).');
      return;
    }

    // Pause video for region selection
    this.editor.togglePlayback();

    this.panel.setState('selecting');

    const canvasEl = this.editor.getCanvasEl();
    this.regionSelector = new RegionSelector(canvasEl, videoEl, (region) => {
      this.selectedRegion = region;
      this.regionSelector?.deactivate();
      this.panel.setRegion(region);
    });
    this.regionSelector.activate();
  }

  /** Start the tracking process */
  async startTracking(options: TrackingOptions): Promise<void> {
    const videoEl = this.getVideoElement();
    if (!videoEl || !this.selectedRegion) return;

    this.panel.setState('tracking');

    try {
      this.extractor = new FrameExtractor(videoEl);

      if (!this.extractor.canExtract()) {
        this.panel.setError('CORS policy blocks canvas access. Ensure the video is served with CORS headers.');
        this.extractor.destroy();
        return;
      }

      this.tracker = new CombinedTracker(this.extractor, options);
      await this.tracker.init(this.selectedRegion);

      const results = await this.tracker.track({
        onProgress: (progress) => this.panel.updateProgress(progress),
      });

      this.lastResults = results;

      // Generate simplified keyframes for count display
      const rawKf = trackingResultsToKeyframes(results, this.extractor.width, this.extractor.height);
      const simplified = simplifyKeyframes(rawKf);

      this.panel.setResults(results, simplified.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Tracking failed';
      this.panel.setError(message);
    } finally {
      this.tracker?.destroy();
      this.tracker = null;
    }
  }

  /** Apply tracking results to the selected hotspot */
  applyResults(results: TrackingResult[]): void {
    const selectedId = this.editor.getSelection().getSelectedId();
    if (!selectedId || !this.extractor) return;

    const rawKf = trackingResultsToKeyframes(results, this.extractor.width, this.extractor.height);
    const simplified = simplifyKeyframes(rawKf);
    const keyframes = toHotspotKeyframes(simplified);

    const avgConfidence = results.length > 0
      ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
      : 0;

    const trackingMeta: TrackingMetadata = {
      source: 'browser',
      algorithm: 'template+camshift',
      avgConfidence,
      region: this.selectedRegion ?? undefined,
      trackedAt: new Date().toISOString(),
    };

    this.editor.updateHotspot(selectedId, { keyframes, trackingMeta } as any);
    this.editor.showToast(`Applied ${keyframes.length} keyframes`);
    this.reset();
  }

  /** Preview tracking path (seek through keyframes) */
  previewResults(results: TrackingResult[]): void {
    if (results.length === 0) return;
    // Seek to start of tracking to show the result
    this.editor.seekVideo(results[0].time);
    this.editor.togglePlayback();
  }

  /** Cancel ongoing tracking or selection */
  cancel(): void {
    this.tracker?.cancel();
    this.regionSelector?.deactivate();
    this.reset();
  }

  /** Discard results and reset */
  discard(): void {
    this.reset();
  }

  /** Refresh panel state (called when selection changes) */
  refresh(): void {
    if (this.panel) {
      this.panel.setState('idle');
    }
  }

  private reset(): void {
    this.regionSelector?.destroy();
    this.regionSelector = null;
    this.extractor?.destroy();
    this.extractor = null;
    this.tracker?.destroy();
    this.tracker = null;
    this.selectedRegion = null;
    this.lastResults = null;
    this.panel.setState('idle');
  }

  private getVideoElement(): HTMLVideoElement | null {
    const viewer = this.editor.getViewer();
    if (!viewer) return null;
    return (viewer as any).getVideoElement?.() ?? null;
  }

  destroy(): void {
    this.cancel();
    this.panel.destroy();
  }
}
