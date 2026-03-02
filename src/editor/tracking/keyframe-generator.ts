import type { TrackingResult } from './types';
import type { Keyframe } from '../../core/types';

/** Convert tracking results (pixels) to percentage-based points */
export function trackingResultsToKeyframes(
  results: TrackingResult[],
  videoWidth: number,
  videoHeight: number,
  minConfidence = 0.3,
): Array<{ time: number; x: number; y: number }> {
  return results
    .filter(r => r.confidence >= minConfidence)
    .map(r => ({
      time: r.time,
      x: (r.x / videoWidth) * 100,
      y: (r.y / videoHeight) * 100,
    }));
}

/**
 * Ramer-Douglas-Peucker simplification for time-series keyframes.
 * Removes redundant keyframes where position barely changes.
 * @param epsilon threshold in percentage units (e.g., 0.5 = half a percent)
 */
export function simplifyKeyframes(
  keyframes: Array<{ time: number; x: number; y: number }>,
  epsilon = 0.5,
): Array<{ time: number; x: number; y: number }> {
  if (keyframes.length <= 2) return [...keyframes];

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

/** Perpendicular distance from a point to a line defined by two endpoints */
function perpendicularDistance(
  point: { time: number; x: number; y: number },
  lineStart: { time: number; x: number; y: number },
  lineEnd: { time: number; x: number; y: number },
): number {
  const tRange = lineEnd.time - lineStart.time;
  if (tRange === 0) {
    const dx = point.x - lineStart.x;
    const dy = point.y - lineStart.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

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
    time: Math.round(kf.time * 100) / 100,
    x: `${Math.round(kf.x * 100) / 100}%`,
    y: `${Math.round(kf.y * 100) / 100}%`,
  }));
}
