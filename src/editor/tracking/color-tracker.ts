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

  const x0 = Math.max(0, Math.round(region.x));
  const y0 = Math.max(0, Math.round(region.y));
  const x1 = Math.min(width, Math.round(region.x + region.width));
  const y1 = Math.min(imageData.height, Math.round(region.y + region.height));

  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const idx = (py * width + px) * 4;
      const [h, s, v] = rgbToHsv(data[idx], data[idx + 1], data[idx + 2]);

      if (v < 0.1) continue;

      const hIdx = Math.min(Math.floor(h / (360 / H_BINS)), H_BINS - 1);
      const sIdx = Math.min(Math.floor(s * S_BINS), S_BINS - 1);
      hBins[hIdx]++;
      sBins[sIdx]++;
      totalPixels++;
    }
  }

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

    prob[i] = (histogram.hBins[hIdx] + histogram.sBins[sIdx]) / 2;
  }

  return prob;
}

/** MeanShift: find the center of mass within the current window */
export function meanShift(
  probMap: Float32Array,
  frameWidth: number,
  region: TrackingRegion,
  maxIterations = 10,
  convergenceThreshold = 1.0,
): { center: { x: number; y: number }; region: TrackingRegion } {
  let cx = region.x + region.width / 2;
  let cy = region.y + region.height / 2;
  const hw = region.width / 2;
  const hh = region.height / 2;
  const frameHeight = probMap.length / frameWidth;

  for (let iter = 0; iter < maxIterations; iter++) {
    let sumW = 0, sumX = 0, sumY = 0;
    const x0 = Math.max(0, Math.floor(cx - hw));
    const y0 = Math.max(0, Math.floor(cy - hh));
    const x1 = Math.min(frameWidth, Math.ceil(cx + hw));
    const y1 = Math.min(frameHeight, Math.ceil(cy + hh));

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

/** CamShift: MeanShift + confidence scoring */
export function camShift(
  probMap: Float32Array,
  frameWidth: number,
  prevRegion: TrackingRegion,
): { center: { x: number; y: number }; region: TrackingRegion; confidence: number } {
  const { center, region } = meanShift(probMap, frameWidth, prevRegion);

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
