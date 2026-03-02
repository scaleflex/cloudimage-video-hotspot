import { buildHistogram, backProject, camShift } from './color-tracker';
import { toGrayscale, extractTemplate, templateMatch } from './template-tracker';
import type { GrayscaleTemplate } from './template-tracker';
import type { TrackingRegion, TrackingResult, TrackingOptions, TrackingProgress, ColorHistogram } from './types';
import type { FrameExtractor } from './frame-extractor';

export interface CombinedTrackerCallbacks {
  onProgress?: (progress: TrackingProgress) => void;
}

/**
 * Two-stage tracker: CamShift finds approximate area, template matching refines position.
 */
export class CombinedTracker {
  private histogram: ColorHistogram | null = null;
  private template: GrayscaleTemplate | null = null;
  private lastRegion: TrackingRegion | null = null;
  private abortController: AbortController | null = null;

  constructor(
    private extractor: FrameExtractor,
    private options: TrackingOptions,
  ) {}

  /** Initialize tracker with the first frame and selected region */
  async init(region: TrackingRegion): Promise<void> {
    const frame = await this.extractor.extractFrame(this.options.startTime);

    this.histogram = buildHistogram(frame, region);

    const gray = toGrayscale(frame);
    this.template = extractTemplate(gray, this.extractor.width, region);

    this.lastRegion = { ...region };
  }

  /** Run tracking across the time range. Returns array of results. */
  async track(callbacks?: CombinedTrackerCallbacks): Promise<TrackingResult[]> {
    if (!this.histogram || !this.template || !this.lastRegion) {
      throw new Error('Tracker not initialized. Call init() first.');
    }

    this.abortController = new AbortController();
    const results: TrackingResult[] = [];
    const { startTime, endTime, fps, searchRadius, confidenceThreshold } = this.options;
    const totalFrames = Math.ceil((endTime - startTime) * fps);
    let frameIndex = 0;

    const frames = this.extractor.extractFrames(
      startTime, endTime, fps, this.abortController.signal,
    );

    for await (const { time, imageData } of frames) {
      frameIndex++;

      // --- Stage 1: CamShift (coarse, color-based) ---
      const probMap = backProject(imageData, this.histogram!);
      const colorResult = camShift(probMap, this.extractor.width, this.lastRegion!);

      // --- Stage 2: Template Match (precise, within CamShift area) ---
      const gray = toGrayscale(imageData);
      const expandedRegion = expandRegion(
        colorResult.region,
        searchRadius,
        this.extractor.width,
        this.extractor.height,
      );
      const templateResult = templateMatch(
        gray,
        this.extractor.width,
        this.extractor.height,
        this.template!,
        expandedRegion,
      );

      // --- Decision logic ---
      let finalX: number, finalY: number, finalConfidence: number;

      if (templateResult.confidence >= confidenceThreshold) {
        // Template matched well — use precise template position
        finalX = templateResult.x;
        finalY = templateResult.y;
        finalConfidence = templateResult.confidence;
      } else if (colorResult.confidence >= confidenceThreshold * 0.5) {
        // Template lost but color still tracking — use color position
        finalX = colorResult.center.x;
        finalY = colorResult.center.y;
        finalConfidence = colorResult.confidence;

        // Update template to adapt to object's new appearance
        this.template = extractTemplate(gray, this.extractor.width, {
          x: Math.round(finalX - this.lastRegion!.width / 2),
          y: Math.round(finalY - this.lastRegion!.height / 2),
          width: this.lastRegion!.width,
          height: this.lastRegion!.height,
        });
      } else {
        // Both lost — record with zero confidence
        finalX = this.lastRegion!.x + this.lastRegion!.width / 2;
        finalY = this.lastRegion!.y + this.lastRegion!.height / 2;
        finalConfidence = 0;
      }

      // Update last known region
      this.lastRegion = {
        x: Math.round(finalX - this.lastRegion!.width / 2),
        y: Math.round(finalY - this.lastRegion!.height / 2),
        width: this.lastRegion!.width,
        height: this.lastRegion!.height,
      };

      results.push({
        time,
        x: finalX,
        y: finalY,
        width: this.lastRegion.width,
        height: this.lastRegion.height,
        confidence: finalConfidence,
      });

      callbacks?.onProgress?.({
        currentFrame: frameIndex,
        totalFrames,
        currentTime: time,
        confidence: finalConfidence,
        percent: (frameIndex / totalFrames) * 100,
      });

      // Adaptive template refresh when confidence is good
      if (templateResult.confidence > 0.8 && frameIndex % 10 === 0) {
        this.template = extractTemplate(gray, this.extractor.width, this.lastRegion);
      }
    }

    return results;
  }

  /** Cancel an in-progress tracking operation */
  cancel(): void {
    this.abortController?.abort();
  }

  destroy(): void {
    this.cancel();
    this.histogram = null;
    this.template = null;
    this.lastRegion = null;
  }
}

/** Expand a region by a factor, clamping to frame bounds */
function expandRegion(
  region: TrackingRegion,
  factor: number,
  maxWidth: number,
  maxHeight: number,
): TrackingRegion {
  const cx = region.x + region.width / 2;
  const cy = region.y + region.height / 2;
  const newW = region.width * factor;
  const newH = region.height * factor;

  return {
    x: Math.max(0, Math.round(cx - newW / 2)),
    y: Math.max(0, Math.round(cy - newH / 2)),
    width: Math.min(maxWidth, Math.round(newW)),
    height: Math.min(maxHeight, Math.round(newH)),
  };
}
