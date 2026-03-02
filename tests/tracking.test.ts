import { describe, it, expect } from 'vitest';
import { toGrayscale, extractTemplate, templateMatch } from '../src/editor/tracking/template-tracker';
import { buildHistogram, backProject, meanShift, camShift } from '../src/editor/tracking/color-tracker';
import { trackingResultsToKeyframes, simplifyKeyframes, toHotspotKeyframes } from '../src/editor/tracking/keyframe-generator';
import type { TrackingRegion, TrackingResult } from '../src/editor/tracking/types';

// Helper: create a fake ImageData (plain object — jsdom lacks ImageData constructor)
function createImageData(width: number, height: number, fillRGBA: [number, number, number, number]): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = fillRGBA[0];
    data[i * 4 + 1] = fillRGBA[1];
    data[i * 4 + 2] = fillRGBA[2];
    data[i * 4 + 3] = fillRGBA[3];
  }
  return { data, width, height, colorSpace: 'srgb' } as ImageData;
}

// Helper: paint a region with a specific color
function paintRegion(imageData: ImageData, region: TrackingRegion, rgba: [number, number, number, number]): void {
  const { data, width } = imageData;
  for (let py = region.y; py < region.y + region.height; py++) {
    for (let px = region.x; px < region.x + region.width; px++) {
      const idx = (py * width + px) * 4;
      data[idx] = rgba[0];
      data[idx + 1] = rgba[1];
      data[idx + 2] = rgba[2];
      data[idx + 3] = rgba[3];
    }
  }
}

describe('Template Tracker', () => {
  it('toGrayscale converts RGBA to grayscale', () => {
    const img = createImageData(2, 2, [255, 255, 255, 255]);
    const gray = toGrayscale(img);
    expect(gray.length).toBe(4);
    // White should be close to 255
    expect(gray[0]).toBeGreaterThan(250);
  });

  it('toGrayscale handles black pixels', () => {
    const img = createImageData(2, 2, [0, 0, 0, 255]);
    const gray = toGrayscale(img);
    expect(gray[0]).toBe(0);
  });

  it('extractTemplate extracts correct region', () => {
    const img = createImageData(10, 10, [100, 100, 100, 255]);
    const gray = toGrayscale(img);
    const template = extractTemplate(gray, 10, { x: 2, y: 2, width: 3, height: 3 });
    expect(template.width).toBe(3);
    expect(template.height).toBe(3);
    expect(template.data.length).toBe(9);
  });

  it('templateMatch finds exact match at known position', () => {
    // Create 20x20 dark frame with a textured 4x4 block at (8, 8)
    const img = createImageData(20, 20, [20, 20, 20, 255]);
    // Paint a gradient pattern (not uniform) so NCC has variance to work with
    const { data, width } = img;
    for (let py = 0; py < 4; py++) {
      for (let px = 0; px < 4; px++) {
        const idx = ((8 + py) * width + (8 + px)) * 4;
        const val = 120 + py * 30 + px * 10; // gradient: 120-250
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
      }
    }

    const gray = toGrayscale(img);
    const template = extractTemplate(gray, 20, { x: 8, y: 8, width: 4, height: 4 });

    const result = templateMatch(gray, 20, 20, template, { x: 0, y: 0, width: 20, height: 20 });

    // Should find the block center at (10, 10)
    expect(result.x).toBe(10); // 8 + 4/2
    expect(result.y).toBe(10);
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('templateMatch returns low confidence for no match', () => {
    // Uniform frame — no distinct pattern to find
    const img = createImageData(20, 20, [128, 128, 128, 255]);
    const gray = toGrayscale(img);

    // Template of a different pattern
    const templateGray = new Uint8Array(9);
    templateGray.fill(255); // all white
    const template = { data: templateGray, width: 3, height: 3 };

    const result = templateMatch(gray, 20, 20, template, { x: 0, y: 0, width: 20, height: 20 });
    // NCC of constant vs constant = 0 (zero variance)
    expect(result.confidence).toBe(0);
  });
});

describe('Color Tracker', () => {
  it('buildHistogram creates non-empty histogram for colored region', () => {
    // Red image
    const img = createImageData(10, 10, [255, 0, 0, 255]);
    const hist = buildHistogram(img, { x: 0, y: 0, width: 10, height: 10 });

    expect(hist.hBins.length).toBe(16);
    expect(hist.sBins.length).toBe(8);
    // Should have values in the red hue bin (0° hue = bin 0)
    expect(hist.hBins[0]).toBeGreaterThan(0);
  });

  it('buildHistogram skips very dark pixels', () => {
    const img = createImageData(10, 10, [1, 1, 1, 255]); // nearly black
    const hist = buildHistogram(img, { x: 0, y: 0, width: 10, height: 10 });
    // All pixels should be skipped (v < 0.1)
    const totalH = hist.hBins.reduce((a, b) => a + b, 0);
    expect(totalH).toBe(0);
  });

  it('backProject creates probability map', () => {
    const img = createImageData(10, 10, [255, 0, 0, 255]);
    const hist = buildHistogram(img, { x: 0, y: 0, width: 10, height: 10 });
    const prob = backProject(img, hist);

    expect(prob.length).toBe(100);
    // All red pixels should have positive probability
    expect(prob[0]).toBeGreaterThan(0);
  });

  it('meanShift converges on center of mass', () => {
    // 10x10 probability map with high values in center
    const probMap = new Float32Array(100);
    for (let y = 3; y < 7; y++) {
      for (let x = 3; x < 7; x++) {
        probMap[y * 10 + x] = 1.0;
      }
    }

    const result = meanShift(probMap, 10, { x: 0, y: 0, width: 10, height: 10 });
    // Should converge near center of the high-prob area (4.5, 4.5)
    expect(result.center.x).toBeCloseTo(4.5, 0);
    expect(result.center.y).toBeCloseTo(4.5, 0);
  });

  it('camShift returns confidence > 0 for matching region', () => {
    const probMap = new Float32Array(100);
    for (let y = 3; y < 7; y++) {
      for (let x = 3; x < 7; x++) {
        probMap[y * 10 + x] = 0.8;
      }
    }

    const result = camShift(probMap, 10, { x: 2, y: 2, width: 6, height: 6 });
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.center.x).toBeGreaterThan(0);
    expect(result.center.y).toBeGreaterThan(0);
  });
});

describe('Keyframe Generator', () => {
  const sampleResults: TrackingResult[] = [
    { time: 0, x: 100, y: 200, width: 50, height: 50, confidence: 0.9 },
    { time: 0.5, x: 110, y: 205, width: 50, height: 50, confidence: 0.85 },
    { time: 1.0, x: 120, y: 210, width: 50, height: 50, confidence: 0.8 },
    { time: 1.5, x: 130, y: 215, width: 50, height: 50, confidence: 0.1 }, // low confidence
    { time: 2.0, x: 140, y: 220, width: 50, height: 50, confidence: 0.75 },
  ];

  it('trackingResultsToKeyframes converts pixels to percentages', () => {
    const kf = trackingResultsToKeyframes(sampleResults, 1920, 1080);
    expect(kf.length).toBe(4); // 1 filtered out (confidence 0.1)
    expect(kf[0].x).toBeCloseTo((100 / 1920) * 100, 2);
    expect(kf[0].y).toBeCloseTo((200 / 1080) * 100, 2);
  });

  it('trackingResultsToKeyframes filters by minConfidence', () => {
    const kf = trackingResultsToKeyframes(sampleResults, 1920, 1080, 0.85);
    expect(kf.length).toBe(2); // only 0.9 and 0.85
  });

  it('simplifyKeyframes reduces point count for linear motion', () => {
    // 10 points in a perfect line — should simplify to 2
    const linear = Array.from({ length: 10 }, (_, i) => ({
      time: i,
      x: i * 10,
      y: i * 5,
    }));
    const simplified = simplifyKeyframes(linear, 0.1);
    expect(simplified.length).toBe(2);
    expect(simplified[0].time).toBe(0);
    expect(simplified[1].time).toBe(9);
  });

  it('simplifyKeyframes keeps points for curved motion', () => {
    // Points forming a curve
    const curved = [
      { time: 0, x: 0, y: 0 },
      { time: 1, x: 10, y: 50 }, // deviation from line
      { time: 2, x: 20, y: 10 },
      { time: 3, x: 30, y: 60 }, // deviation
      { time: 4, x: 40, y: 0 },
    ];
    const simplified = simplifyKeyframes(curved, 5);
    // Should keep at least 3 points
    expect(simplified.length).toBeGreaterThanOrEqual(3);
  });

  it('toHotspotKeyframes formats correctly', () => {
    const input = [
      { time: 1.234, x: 50.567, y: 30.123 },
    ];
    const kf = toHotspotKeyframes(input);
    expect(kf[0].time).toBe(1.23);
    expect(kf[0].x).toBe('50.57%');
    expect(kf[0].y).toBe('30.12%');
  });

  it('simplifyKeyframes handles 2 or fewer points', () => {
    expect(simplifyKeyframes([], 0.5)).toEqual([]);
    const single = [{ time: 0, x: 10, y: 20 }];
    expect(simplifyKeyframes(single, 0.5)).toEqual(single);
    const two = [
      { time: 0, x: 10, y: 20 },
      { time: 1, x: 30, y: 40 },
    ];
    expect(simplifyKeyframes(two, 0.5)).toEqual(two);
  });
});
