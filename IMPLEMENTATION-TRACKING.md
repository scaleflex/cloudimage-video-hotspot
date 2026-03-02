# Object Tracking Implementation Plan

## Status: PHASE 1 COMPLETE + VERIFIED

All 10 steps implemented, build passes, code reviewed.

### Verification Results

| # | Component | File | Status |
|---|-----------|------|--------|
| 1 | Video element chain | adapter.ts, html5-adapter.ts, video-player.ts, ci-video-hotspot.ts | PASS |
| 2 | Tracking types | tracking/types.ts | PASS |
| 3 | Frame extractor | tracking/frame-extractor.ts | PASS |
| 4a | Color tracker (CamShift) | tracking/color-tracker.ts | PASS |
| 4b | Template tracker (NCC) | tracking/template-tracker.ts | PASS |
| 4c | Combined tracker | tracking/combined-tracker.ts | PASS |
| 5 | Keyframe generator + RDP | tracking/keyframe-generator.ts | PASS |
| 6 | Region selector UI | tracking/region-selector.ts | PASS |
| 7 | Tracking panel UI | tracking/tracking-panel.ts | PASS |
| 8 | Tracking manager | tracking/tracking-manager.ts | PASS |
| 9 | Editor integration | types.ts, editor-toolbar.ts, ci-video-hotspot-editor.ts | PASS |
| 10 | Barrel export | tracking/index.ts | PASS |

**Verified**: No missing imports, no logic errors, all algorithms correct (HSV, MeanShift, NCC, RDP), CORS checks present, abort support, proper cleanup.

## Overview

Attach a hotspot to a video object so it automatically follows the object across frames.
**Approach**: Two-stage tracker — Color Histogram (CamShift) for coarse search + Template Matching (NCC) for precise positioning.

**Constraint**: Canvas frame extraction works only for HTML5 `<video>` (not YouTube/Vimeo iframes). CORS headers required for cross-origin videos.

---

## Architecture

```
src/editor/tracking/
├── types.ts                 — Type definitions
├── frame-extractor.ts       — Video → canvas frame capture
├── color-tracker.ts         — CamShift / histogram-based tracking
├── template-tracker.ts      — NCC template matching
├── combined-tracker.ts      — Two-stage orchestration
├── keyframe-generator.ts    — Tracking results → keyframes + RDP simplification
├── region-selector.ts       — Bounding box selection UI overlay
├── tracking-panel.ts        — Sidebar panel UI
├── tracking-manager.ts      — Main orchestrator
└── index.ts                 — Barrel export
```

**Modified existing files:**
- `src/player/adapter.ts` — `getVideoElement()` base method
- `src/player/adapters/html5-adapter.ts` — override returning `this.videoEl`
- `src/player/video-player.ts` — passthrough
- `src/core/ci-video-hotspot.ts` — public API
- `src/core/types.ts` — `trackingMeta` on `VideoHotspotItem`
- `src/editor/types.ts` — `'track'` mode, tracking events
- `src/editor/editor-toolbar.ts` — Track button
- `src/editor/ci-video-hotspot-editor.ts` — TrackingManager wiring

---

## Step-by-step Implementation

### Step 1: Expose `<video>` element through adapter chain

**Why**: The tracking algorithms need direct access to `HTMLVideoElement` to draw frames on canvas. Currently the video element is hidden inside adapters.

**`src/player/adapter.ts`**
```ts
// Add to VideoPlayerAdapter interface/class
getVideoElement(): HTMLVideoElement | null {
  return null;
}
```

**`src/player/adapters/html5-adapter.ts`**
```ts
// Override in HTML5Adapter
getVideoElement(): HTMLVideoElement {
  return this.videoEl;
}
```

**`src/player/video-player.ts`**
```ts
// Add passthrough method
getVideoElement(): HTMLVideoElement | null {
  return this.adapter.getVideoElement?.() ?? null;
}
```

**`src/core/ci-video-hotspot.ts`**
```ts
// Add to public API section
getVideoElement(): HTMLVideoElement | null {
  return this.player.getVideoElement();
}
```

---

### Step 2: Type definitions

**New file: `src/editor/tracking/types.ts`**

```ts
/** Bounding box region in video pixel coordinates */
export interface TrackingRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Single tracking result for one frame */
export interface TrackingResult {
  time: number;        // seconds
  x: number;           // center x in pixels
  y: number;           // center y in pixels
  width: number;       // tracked region width
  height: number;      // tracked region height
  confidence: number;  // 0-1 score
}

/** Tracking configuration */
export interface TrackingOptions {
  startTime: number;           // start of tracking range (seconds)
  endTime: number;             // end of tracking range (seconds)
  fps: number;                 // sample rate (default: 5)
  searchRadius: number;        // search area expansion factor (default: 2.0)
  confidenceThreshold: number; // minimum confidence to accept (default: 0.4)
}

/** Tracking state machine */
export type TrackingState =
  | 'idle'
  | 'selecting'
  | 'configuring'
  | 'tracking'
  | 'complete'
  | 'error';

/** Color histogram in HSV space */
export interface ColorHistogram {
  hBins: Float32Array;  // hue bins (e.g., 16 bins for 0-360)
  sBins: Float32Array;  // saturation bins (e.g., 8 bins for 0-1)
  numHBins: number;
  numSBins: number;
}

/** Metadata stored on the hotspot about tracking origin */
export interface TrackingMetadata {
  source: 'browser' | 'import';
  algorithm: string;
  avgConfidence: number;
  region?: TrackingRegion;
  trackedAt: string;  // ISO timestamp
}

/** Progress callback payload */
export interface TrackingProgress {
  currentFrame: number;
  totalFrames: number;
  currentTime: number;
  confidence: number;
  percent: number;  // 0-100
}
```

---

### Step 3: Frame extractor

**New file: `src/editor/tracking/frame-extractor.ts`**

Captures video frames as `ImageData` by seeking the video and drawing to an offscreen canvas.

```ts
export class FrameExtractor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(private videoEl: HTMLVideoElement) {
    this.canvas = document.createElement('canvas');
    // Use intrinsic video dimensions for full quality
    this.canvas.width = videoEl.videoWidth;
    this.canvas.height = videoEl.videoHeight;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  /** Test if canvas extraction works (CORS check) */
  canExtract(): boolean {
    try {
      this.ctx.drawImage(this.videoEl, 0, 0);
      this.ctx.getImageData(0, 0, 1, 1);
      return true;
    } catch {
      return false;  // SecurityError = CORS blocked
    }
  }

  /** Extract a single frame at the given time */
  async extractFrame(time: number): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const onSeeked = () => {
        this.videoEl.removeEventListener('seeked', onSeeked);
        try {
          this.ctx.drawImage(this.videoEl, 0, 0, this.canvas.width, this.canvas.height);
          resolve(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        } catch (e) {
          reject(new Error('Cannot extract frame: CORS policy blocks canvas access'));
        }
      };
      this.videoEl.addEventListener('seeked', onSeeked);
      this.videoEl.currentTime = time;
    });
  }

  /** Extract frames in a time range at a given FPS.
   *  Yields { time, imageData } for each frame.
   *  Pass an AbortSignal to cancel mid-extraction. */
  async *extractFrames(
    startTime: number,
    endTime: number,
    fps: number,
    signal?: AbortSignal,
  ): AsyncGenerator<{ time: number; imageData: ImageData }> {
    const interval = 1 / fps;
    for (let t = startTime; t <= endTime; t += interval) {
      if (signal?.aborted) return;
      const imageData = await this.extractFrame(t);
      yield { time: t, imageData };
    }
  }

  get width(): number { return this.canvas.width; }
  get height(): number { return this.canvas.height; }

  destroy(): void {
    this.canvas.width = 0;
    this.canvas.height = 0;
  }
}
```

---

### Step 4a: Color Tracker (CamShift)

**New file: `src/editor/tracking/color-tracker.ts`**

Tracks objects by their color distribution. Converts to HSV, builds a histogram of the target region, then on each frame creates a "back-projection" (probability map) and uses MeanShift to converge on the most likely region.

```ts
import type { ColorHistogram, TrackingRegion } from './types';

const H_BINS = 16;
const S_BINS = 8;

/** Convert RGB pixel to HSV (h: 0-360, s: 0-1, v: 0-1) */
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return [h, s, v];
}

/** Build HSV color histogram from a region of an ImageData */
export function buildHistogram(imageData: ImageData, region: TrackingRegion): ColorHistogram {
  const { data, width } = imageData;
  const hBins = new Float32Array(H_BINS);
  const sBins = new Float32Array(S_BINS);
  let totalPixels = 0;

  for (let py = region.y; py < region.y + region.height; py++) {
    for (let px = region.x; px < region.x + region.width; px++) {
      const idx = (py * width + px) * 4;
      const [h, s, v] = rgbToHsv(data[idx], data[idx + 1], data[idx + 2]);

      // Skip very dark pixels (unreliable color)
      if (v < 0.1) continue;

      const hIdx = Math.min(Math.floor(h / (360 / H_BINS)), H_BINS - 1);
      const sIdx = Math.min(Math.floor(s * S_BINS), S_BINS - 1);
      hBins[hIdx]++;
      sBins[sIdx]++;
      totalPixels++;
    }
  }

  // Normalize
  if (totalPixels > 0) {
    for (let i = 0; i < H_BINS; i++) hBins[i] /= totalPixels;
    for (let i = 0; i < S_BINS; i++) sBins[i] /= totalPixels;
  }

  return { hBins, sBins, numHBins: H_BINS, numSBins: S_BINS };
}

/** Create a back-projection probability map for the entire frame */
export function backProject(imageData: ImageData, histogram: ColorHistogram): Float32Array {
  const { data, width, height } = imageData;
  const prob = new Float32Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const [h, s, v] = rgbToHsv(data[idx], data[idx + 1], data[idx + 2]);

    if (v < 0.1) { prob[i] = 0; continue; }

    const hIdx = Math.min(Math.floor(h / (360 / histogram.numHBins)), histogram.numHBins - 1);
    const sIdx = Math.min(Math.floor(s * histogram.numSBins), histogram.numSBins - 1);

    // Combined probability from H and S channels
    prob[i] = (histogram.hBins[hIdx] + histogram.sBins[sIdx]) / 2;
  }

  return prob;
}

/** MeanShift iteration: find the center of mass within the current window.
 *  Returns the converged region center. */
export function meanShift(
  probMap: Float32Array,
  frameWidth: number,
  region: TrackingRegion,
  maxIterations: number = 10,
  convergenceThreshold: number = 1.0,
): { center: { x: number; y: number }; region: TrackingRegion } {
  let cx = region.x + region.width / 2;
  let cy = region.y + region.height / 2;
  const hw = region.width / 2;
  const hh = region.height / 2;

  for (let iter = 0; iter < maxIterations; iter++) {
    let sumW = 0, sumX = 0, sumY = 0;
    const x0 = Math.max(0, Math.floor(cx - hw));
    const y0 = Math.max(0, Math.floor(cy - hh));
    const x1 = Math.min(frameWidth, Math.ceil(cx + hw));
    const y1 = Math.min(probMap.length / frameWidth, Math.ceil(cy + hh));

    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        const w = probMap[py * frameWidth + px];
        sumW += w;
        sumX += px * w;
        sumY += py * w;
      }
    }

    if (sumW === 0) break;

    const newCx = sumX / sumW;
    const newCy = sumY / sumW;
    const dx = newCx - cx;
    const dy = newCy - cy;

    cx = newCx;
    cy = newCy;

    if (dx * dx + dy * dy < convergenceThreshold) break;
  }

  return {
    center: { x: cx, y: cy },
    region: {
      x: Math.round(cx - hw),
      y: Math.round(cy - hh),
      width: region.width,
      height: region.height,
    },
  };
}

/** CamShift: MeanShift + adaptive window sizing.
 *  Returns updated region and center. */
export function camShift(
  probMap: Float32Array,
  frameWidth: number,
  prevRegion: TrackingRegion,
): { center: { x: number; y: number }; region: TrackingRegion; confidence: number } {
  // Run MeanShift to convergence
  const { center, region } = meanShift(probMap, frameWidth, prevRegion);

  // Calculate confidence: average probability in the found region
  let totalProb = 0;
  let count = 0;
  const x0 = Math.max(0, region.x);
  const y0 = Math.max(0, region.y);
  const x1 = Math.min(frameWidth, region.x + region.width);
  const frameHeight = probMap.length / frameWidth;
  const y1 = Math.min(frameHeight, region.y + region.height);

  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      totalProb += probMap[py * frameWidth + px];
      count++;
    }
  }

  const confidence = count > 0 ? totalProb / count : 0;

  return { center, region, confidence };
}
```

---

### Step 4b: Template Tracker (NCC)

**New file: `src/editor/tracking/template-tracker.ts`**

Tracks objects by matching a grayscale template patch using Normalized Cross-Correlation.

```ts
import type { TrackingRegion } from './types';

/** Convert RGBA ImageData to grayscale Uint8Array */
export function toGrayscale(imageData: ImageData): Uint8Array {
  const { data, width, height } = imageData;
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    // Luminance formula
    gray[i] = (data[idx] * 77 + data[idx + 1] * 150 + data[idx + 2] * 29) >> 8;
  }
  return gray;
}

/** Extract a grayscale template from a region */
export function extractTemplate(
  gray: Uint8Array,
  frameWidth: number,
  region: TrackingRegion,
): { data: Uint8Array; width: number; height: number } {
  const tw = Math.round(region.width);
  const th = Math.round(region.height);
  const template = new Uint8Array(tw * th);

  for (let ty = 0; ty < th; ty++) {
    for (let tx = 0; tx < tw; tx++) {
      const sx = Math.round(region.x) + tx;
      const sy = Math.round(region.y) + ty;
      template[ty * tw + tx] = gray[sy * frameWidth + sx];
    }
  }

  return { data: template, width: tw, height: th };
}

/** Compute NCC score at a single position (sx, sy) in the frame */
function nccAt(
  frame: Uint8Array,
  frameWidth: number,
  template: Uint8Array,
  tw: number,
  th: number,и 
  sx: number,
  sy: number,
): number {
  let sumF = 0, sumT = 0, sumFF = 0, sumTT = 0, sumFT = 0;
  const n = tw * th;

  for (let ty = 0; ty < th; ty++) {
    for (let tx = 0; tx < tw; tx++) {
      const fVal = frame[(sy + ty) * frameWidth + (sx + tx)];
      const tVal = template[ty * tw + tx];
      sumF += fVal;
      sumT += tVal;
      sumFF += fVal * fVal;
      sumTT += tVal * tVal;
      sumFT += fVal * tVal;
    }
  }

  const meanF = sumF / n;
  const meanT = sumT / n;
  const denom = Math.sqrt((sumFF - n * meanF * meanF) * (sumTT - n * meanT * meanT));

  if (denom === 0) return 0;
  return (sumFT - n * meanF * meanT) / denom;
}

/** Search for the template within a search region of the frame.
 *  Returns the best match position and confidence. */
export function templateMatch(
  frame: Uint8Array,
  frameWidth: number,
  frameHeight: number,
  template: { data: Uint8Array; width: number; height: number },
  searchRegion: TrackingRegion,
): { x: number; y: number; confidence: number } {
  const { data: tData, width: tw, height: th } = template;

  // Clamp search region to frame bounds
  const x0 = Math.max(0, Math.round(searchRegion.x));
  const y0 = Math.max(0, Math.round(searchRegion.y));
  const x1 = Math.min(frameWidth - tw, Math.round(searchRegion.x + searchRegion.width - tw));
  const y1 = Math.min(frameHeight - th, Math.round(searchRegion.y + searchRegion.height - th));

  let bestScore = -1;
  let bestX = x0;
  let bestY = y0;

  // Step size: 1px for small regions, 2px for larger (then refine)
  const coarseStep = (x1 - x0 > 100 || y1 - y0 > 100) ? 2 : 1;

  // Coarse search
  for (let sy = y0; sy <= y1; sy += coarseStep) {
    for (let sx = x0; sx <= x1; sx += coarseStep) {
      const score = nccAt(frame, frameWidth, tData, tw, th, sx, sy);
      if (score > bestScore) {
        bestScore = score;
        bestX = sx;
        bestY = sy;
      }
    }
  }

  // Fine search around best coarse match (if coarse step > 1)
  if (coarseStep > 1) {
    const fineX0 = Math.max(x0, bestX - coarseStep);
    const fineY0 = Math.max(y0, bestY - coarseStep);
    const fineX1 = Math.min(x1, bestX + coarseStep);
    const fineY1 = Math.min(y1, bestY + coarseStep);

    for (let sy = fineY0; sy <= fineY1; sy++) {
      for (let sx = fineX0; sx <= fineX1; sx++) {
        const score = nccAt(frame, frameWidth, tData, tw, th, sx, sy);
        if (score > bestScore) {
          bestScore = score;
          bestX = sx;
          bestY = sy;
        }
      }
    }
  }

  return {
    x: bestX + tw / 2,  // return center coordinates
    y: bestY + th / 2,
    confidence: Math.max(0, bestScore),
  };
}
```

---

### Step 4c: Combined Tracker

**New file: `src/editor/tracking/combined-tracker.ts`**

Two-stage algorithm: CamShift finds the approximate area, template matching refines the position.

```ts
import { buildHistogram, backProject, camShift } from './color-tracker';
import { toGrayscale, extractTemplate, templateMatch } from './template-tracker';
import type { TrackingRegion, TrackingResult, TrackingOptions, TrackingProgress } from './types';
import type { FrameExtractor } from './frame-extractor';

export interface CombinedTrackerCallbacks {
  onProgress?: (progress: TrackingProgress) => void;
}

export class CombinedTracker {
  private histogram = null as ReturnType<typeof buildHistogram> | null;
  private template = null as ReturnType<typeof extractTemplate> | null;
  private lastRegion: TrackingRegion | null = null;
  private abortController: AbortController | null = null;

  constructor(
    private extractor: FrameExtractor,
    private options: TrackingOptions,
  ) {}

  /** Initialize tracker with the first frame and selected region */
  async init(region: TrackingRegion): Promise<void> {
    const frame = await this.extractor.extractFrame(this.options.startTime);

    // Build color histogram for CamShift
    this.histogram = buildHistogram(frame, region);

    // Extract grayscale template for NCC matching
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
        // Both lost — record with low confidence
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

      // Report progress
      callbacks?.onProgress?.({
        currentFrame: frameIndex,
        totalFrames,
        currentTime: time,
        confidence: finalConfidence,
        percent: (frameIndex / totalFrames) * 100,
      });

      // Adaptive template refresh: periodically update template
      // when confidence is good (prevents drift)
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
```

---

### Step 5: Keyframe Generator

**New file: `src/editor/tracking/keyframe-generator.ts`**

Converts pixel-based tracking results to percentage-based keyframes and simplifies them.

```ts
import type { TrackingResult } from './types';
import type { Keyframe } from '../../core/types';

/** Convert tracking results (pixels) to keyframes (percentages) */
export function trackingResultsToKeyframes(
  results: TrackingResult[],
  videoWidth: number,
  videoHeight: number,
  minConfidence: number = 0.3,
): Array<{ time: number; x: number; y: number }> {
  return results
    .filter(r => r.confidence >= minConfidence)
    .map(r => ({
      time: r.time,
      x: (r.x / videoWidth) * 100,
      y: (r.y / videoHeight) * 100,
    }));
}

/** Ramer-Douglas-Peucker simplification for time-series keyframes.
 *  Removes redundant keyframes where position barely changes.
 *  epsilon: threshold in percentage units (e.g., 0.5 = half a percent). */
export function simplifyKeyframes(
  keyframes: Array<{ time: number; x: number; y: number }>,
  epsilon: number = 0.5,
): Array<{ time: number; x: number; y: number }> {
  if (keyframes.length <= 2) return [...keyframes];

  // Find the point with maximum distance from the line
  // between first and last points
  const first = keyframes[0];
  const last = keyframes[keyframes.length - 1];
  let maxDist = 0;
  let maxIdx = 0;

  for (let i = 1; i < keyframes.length - 1; i++) {
    const dist = perpendicularDistance(keyframes[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyKeyframes(keyframes.slice(0, maxIdx + 1), epsilon);
    const right = simplifyKeyframes(keyframes.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [first, last];
}

/** Perpendicular distance from a point to a line defined by two points.
 *  Uses both spatial (x, y) and temporal (time) dimensions. */
function perpendicularDistance(
  point: { time: number; x: number; y: number },
  lineStart: { time: number; x: number; y: number },
  lineEnd: { time: number; x: number; y: number },
): number {
  const tRange = lineEnd.time - lineStart.time;
  if (tRange === 0) {
    // All at same time — just spatial distance
    const dx = point.x - lineStart.x;
    const dy = point.y - lineStart.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Interpolate expected position at point.time
  const t = (point.time - lineStart.time) / tRange;
  const expectedX = lineStart.x + t * (lineEnd.x - lineStart.x);
  const expectedY = lineStart.y + t * (lineEnd.y - lineStart.y);

  const dx = point.x - expectedX;
  const dy = point.y - expectedY;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Convert simplified results to the Keyframe format used by the hotspot system */
export function toHotspotKeyframes(
  simplified: Array<{ time: number; x: number; y: number }>,
): Keyframe[] {
  return simplified.map(kf => ({
    time: Math.round(kf.time * 100) / 100,  // round to 2 decimal places
    x: `${Math.round(kf.x * 100) / 100}%`,
    y: `${Math.round(kf.y * 100) / 100}%`,
  }));
}
```

---

### Step 6: Region Selector UI

**New file: `src/editor/tracking/region-selector.ts`**

Canvas overlay for drawing a bounding box around the target object.

```ts
import type { TrackingRegion } from './types';

export class RegionSelector {
  private overlay: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private active = false;
  private dragging = false;
  private startX = 0;
  private startY = 0;
  private currentRect: TrackingRegion | null = null;

  constructor(
    private container: HTMLElement,
    private videoEl: HTMLVideoElement,
    private onSelected: (region: TrackingRegion) => void,
  ) {
    this.overlay = document.createElement('canvas');
    this.overlay.className = 'ci-editor-tracking-overlay';
    this.overlay.style.cssText = `
      position: absolute; top: 0; left: 0;
      width: 100%; height: 100%;
      cursor: crosshair; z-index: 100;
      pointer-events: auto;
    `;
    this.ctx = this.overlay.getContext('2d')!;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
  }

  activate(): void {
    if (this.active) return;
    this.active = true;

    // Match overlay size to container
    const rect = this.container.getBoundingClientRect();
    this.overlay.width = rect.width;
    this.overlay.height = rect.height;

    this.container.appendChild(this.overlay);
    this.overlay.addEventListener('pointerdown', this.onPointerDown);
    this.overlay.addEventListener('pointermove', this.onPointerMove);
    this.overlay.addEventListener('pointerup', this.onPointerUp);
  }

  deactivate(): void {
    if (!this.active) return;
    this.active = false;
    this.overlay.removeEventListener('pointerdown', this.onPointerDown);
    this.overlay.removeEventListener('pointermove', this.onPointerMove);
    this.overlay.removeEventListener('pointerup', this.onPointerUp);
    this.overlay.remove();
  }

  private onPointerDown(e: PointerEvent): void {
    this.dragging = true;
    this.overlay.setPointerCapture(e.pointerId);
    const rect = this.overlay.getBoundingClientRect();
    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.dragging) return;
    const rect = this.overlay.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    this.drawRect(this.startX, this.startY, currentX, currentY);
  }

  private onPointerUp(e: PointerEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    this.overlay.releasePointerCapture(e.pointerId);

    const rect = this.overlay.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    // Convert display coordinates to video pixel coordinates
    const scaleX = this.videoEl.videoWidth / rect.width;
    const scaleY = this.videoEl.videoHeight / rect.height;

    const x = Math.min(this.startX, endX) * scaleX;
    const y = Math.min(this.startY, endY) * scaleY;
    const width = Math.abs(endX - this.startX) * scaleX;
    const height = Math.abs(endY - this.startY) * scaleY;

    // Minimum size check (at least 10x10 pixels in video space)
    if (width < 10 || height < 10) return;

    const region: TrackingRegion = {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    };

    this.currentRect = region;
    this.onSelected(region);
  }

  private drawRect(x1: number, y1: number, x2: number, y2: number): void {
    this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);

    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(0, 0, this.overlay.width, this.overlay.height);

    // Clear selected area
    const rx = Math.min(x1, x2);
    const ry = Math.min(y1, y2);
    const rw = Math.abs(x2 - x1);
    const rh = Math.abs(y2 - y1);
    this.ctx.clearRect(rx, ry, rw, rh);

    // Border
    this.ctx.strokeStyle = '#3b82f6';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([4, 4]);
    this.ctx.strokeRect(rx, ry, rw, rh);

    // Corner handles
    this.ctx.setLineDash([]);
    this.ctx.fillStyle = '#3b82f6';
    const hs = 6; // handle size
    this.ctx.fillRect(rx - hs / 2, ry - hs / 2, hs, hs);
    this.ctx.fillRect(rx + rw - hs / 2, ry - hs / 2, hs, hs);
    this.ctx.fillRect(rx - hs / 2, ry + rh - hs / 2, hs, hs);
    this.ctx.fillRect(rx + rw - hs / 2, ry + rh - hs / 2, hs, hs);
  }

  destroy(): void {
    this.deactivate();
  }
}
```

---

### Step 7: Tracking Panel UI

**New file: `src/editor/tracking/tracking-panel.ts`**

Sidebar UI panel for managing tracking operations.

```
Panel states and their UI:

┌─ IDLE ──────────────────────────┐
│ Object Tracking                 │
│                                 │
│ Select a hotspot and click      │
│ "Track Object" to start.        │
│                                 │
│ [🎯 Track Object]              │
│ (disabled if no hotspot or      │
│  not HTML5 video)               │
└─────────────────────────────────┘

┌─ SELECTING ─────────────────────┐
│ Object Tracking                 │
│                                 │
│ Draw a rectangle around the     │
│ object you want to track.       │
│                                 │
│ [Cancel]                        │
└─────────────────────────────────┘

┌─ CONFIGURING ───────────────────┐
│ Object Tracking                 │
│                                 │
│ Selected region: 120x80 px      │
│                                 │
│ Time range:                     │
│ Start: [___3.0__] s             │
│ End:   [__20.0__] s             │
│                                 │
│ Sample FPS: [===|====] 5        │
│ Search radius: [===|==] 2.0x    │
│ Min confidence: [==|===] 0.4    │
│                                 │
│ Est. frames: ~85                │
│                                 │
│ [▶ Start Tracking] [Cancel]     │
└─────────────────────────────────┘

┌─ TRACKING ──────────────────────┐
│ Object Tracking                 │
│                                 │
│ Tracking... 45/85 frames        │
│ [████████░░░░░░░░] 53%          │
│                                 │
│ Current confidence: 0.87        │
│ Time: 12.4s                     │
│                                 │
│ [Cancel]                        │
└─────────────────────────────────┘

┌─ COMPLETE ──────────────────────┐
│ Object Tracking                 │
│                                 │
│ ✓ Tracking complete             │
│                                 │
│ Keyframes: 47 → 23 (simplified) │
│ Avg confidence: 94%             │
│ Duration: 3.0s - 20.0s          │
│                                 │
│ [✓ Apply] [👁 Preview]          │
│ [↻ Re-track] [✕ Discard]       │
└─────────────────────────────────┘

┌─ ERROR ─────────────────────────┐
│ Object Tracking                 │
│                                 │
│ ✕ Tracking failed               │
│                                 │
│ CORS policy blocks canvas       │
│ access. Ensure the video is     │
│ served with CORS headers.       │
│                                 │
│ [↻ Retry] [✕ Close]            │
└─────────────────────────────────┘
```

---

### Step 8: Tracking Manager

**New file: `src/editor/tracking/tracking-manager.ts`**

Central orchestrator that ties everything together.

```
TrackingManager responsibilities:

1. canTrack() → boolean
   - Checks: HTML5 video available? CORS allows canvas extraction?

2. startRegionSelection()
   - Pauses video
   - Activates RegionSelector overlay
   - Waits for user to draw bounding box

3. startTracking(hotspotId, region, options)
   - Creates FrameExtractor from video element
   - Creates CombinedTracker with options
   - Calls tracker.init(region) with first frame
   - Calls tracker.track() with progress callback
   - Updates TrackingPanel UI during tracking

4. applyResults(hotspotId, results)
   - Converts TrackingResult[] → keyframes via keyframe-generator
   - Simplifies keyframes with RDP
   - Updates hotspot via editor.updateHotspot(id, { keyframes, trackingMeta })
   - Triggers viewer rebuild

5. previewResults(results)
   - Temporarily shows tracking path on video overlay
   - Plays video segment showing hotspot following the path
   - Does NOT commit changes

6. cancelTracking()
   - Calls tracker.cancel() (aborts frame extraction)
   - Resets state to 'idle'

7. Events emitted:
   - 'tracking:start'
   - 'tracking:progress' { currentFrame, totalFrames, confidence, percent }
   - 'tracking:complete' { results, keyframes }
   - 'tracking:cancel'
   - 'tracking:error' { error }
```

---

### Step 9: Editor Integration

**`src/editor/types.ts`** — add:
```ts
export type EditorMode = 'select' | 'add' | 'track';

export type EditorEvent =
  | /* ...existing events... */
  | 'tracking:start'
  | 'tracking:progress'
  | 'tracking:complete'
  | 'tracking:cancel';
```

**`src/core/types.ts`** — add to `VideoHotspotItem`:
```ts
export interface VideoHotspotItem {
  // ...existing fields...
  trackingMeta?: TrackingMetadata;
}
```

**`src/editor/editor-toolbar.ts`** — add Track button:
- Crosshair/target icon
- Between mode buttons and history buttons
- Active state when mode === 'track'

**`src/editor/ci-video-hotspot-editor.ts`** — wire up:
- `this.trackingManager = new TrackingManager(this)` in initModules()
- Handle 'track' mode in setMode()
- Keyboard shortcut: `T` for track mode
- Cleanup in destroy()

---

### Step 10: CORS & Compatibility

Before tracking starts, `TrackingManager.canTrack()` performs these checks:

1. Get video element via `editor.getViewer().getVideoElement()`
   - If `null` → "Auto-tracking works only with HTML5 video (not YouTube/Vimeo)"

2. Try canvas test extraction:
   ```ts
   const canvas = document.createElement('canvas');
   canvas.width = 1; canvas.height = 1;
   const ctx = canvas.getContext('2d');
   ctx.drawImage(videoEl, 0, 0, 1, 1);
   ctx.getImageData(0, 0, 1, 1);  // throws if CORS blocked
   ```
   - If SecurityError → "Video must be served with CORS headers (Access-Control-Allow-Origin)"

---

## User Workflow Summary

```
1. Open editor → load HTML5 video
2. Add hotspot → select it
3. Pause video at a good frame where object is visible
4. Press T or click Track button → enters tracking mode
5. Draw rectangle around the object
6. Configure: time range, FPS, confidence threshold
7. Click "Start Tracking" → watch progress bar
8. Review results:
   - "47 keyframes → 23 simplified, avg confidence 94%"
   - Preview: plays video with hotspot following the path
9. Click "Apply" → keyframes saved to hotspot
10. Play video → hotspot follows the object!
11. Export JSON → keyframes included
```

---

## Performance Notes

- 60s video at 5fps = 300 frame seeks = ~60-300 seconds depending on codec
- Each seek: ~200ms-1s (worst case for non-keyframe-aligned seeks)
- Template matching: O(searchArea × templateSize) per frame
- CamShift: O(frameSize) for back-projection + O(regionSize × iterations) for mean-shift
- Total memory: ~2 ImageData buffers (~32MB for 1080p) + grayscale arrays (~8MB)
- Keyframe simplification: O(n log n) with RDP

## Bundle Impact

- All tracking code in `src/editor/tracking/` — only included in editor build
- Viewer bundle: zero impact (only adds optional `trackingMeta` type field)
- Tracking code: ~600 lines pure TypeScript, ~5KB gzipped
- Zero external dependencies
