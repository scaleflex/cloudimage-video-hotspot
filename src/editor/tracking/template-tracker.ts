import type { TrackingRegion } from './types';

export interface GrayscaleTemplate {
  data: Uint8Array;
  width: number;
  height: number;
}

/** Convert RGBA ImageData to grayscale Uint8Array */
export function toGrayscale(imageData: ImageData): Uint8Array {
  const { data, width, height } = imageData;
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = (data[idx] * 77 + data[idx + 1] * 150 + data[idx + 2] * 29) >> 8;
  }
  return gray;
}

/** Extract a grayscale template from a region */
export function extractTemplate(
  gray: Uint8Array,
  frameWidth: number,
  region: TrackingRegion,
): GrayscaleTemplate {
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
  th: number,
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
 *  Returns the best match position (center) and confidence. */
export function templateMatch(
  frame: Uint8Array,
  frameWidth: number,
  frameHeight: number,
  template: GrayscaleTemplate,
  searchRegion: TrackingRegion,
): { x: number; y: number; confidence: number } {
  const { data: tData, width: tw, height: th } = template;

  const x0 = Math.max(0, Math.round(searchRegion.x));
  const y0 = Math.max(0, Math.round(searchRegion.y));
  const x1 = Math.min(frameWidth - tw, Math.round(searchRegion.x + searchRegion.width - tw));
  const y1 = Math.min(frameHeight - th, Math.round(searchRegion.y + searchRegion.height - th));

  if (x1 < x0 || y1 < y0) {
    return { x: x0 + tw / 2, y: y0 + th / 2, confidence: 0 };
  }

  let bestScore = -1;
  let bestX = x0;
  let bestY = y0;

  // Use coarse step for large search areas, then refine
  const coarseStep = (x1 - x0 > 100 || y1 - y0 > 100) ? 2 : 1;

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

  // Fine search around best coarse match
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
    x: bestX + tw / 2,
    y: bestY + th / 2,
    confidence: Math.max(0, bestScore),
  };
}
