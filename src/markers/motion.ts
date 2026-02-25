import type { Point, EasingFunction } from '../core/types';

/** Easing functions for keyframe interpolation */
const EASING_FUNCTIONS: Record<EasingFunction, (t: number) => number> = {
  'linear': (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};

/**
 * Interpolate position between keyframes at a given time.
 * Uses binary search for O(log n) lookup of surrounding keyframes.
 */
export function interpolatePosition(
  keyframes: Array<{ time: number; x: number; y: number }>,
  currentTime: number,
  easing: EasingFunction = 'linear',
): Point {
  if (keyframes.length === 0) return { x: 0, y: 0 };
  if (keyframes.length === 1) return { x: keyframes[0].x, y: keyframes[0].y };

  // Before first keyframe
  if (currentTime <= keyframes[0].time) {
    return { x: keyframes[0].x, y: keyframes[0].y };
  }

  // After last keyframe
  const last = keyframes[keyframes.length - 1];
  if (currentTime >= last.time) {
    return { x: last.x, y: last.y };
  }

  // Binary search for the bracketing keyframes
  let lo = 0;
  let hi = keyframes.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (keyframes[mid].time <= currentTime) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const kfA = keyframes[lo];
  const kfB = keyframes[hi];
  const duration = kfB.time - kfA.time;
  if (duration <= 0) return { x: kfA.x, y: kfA.y };

  const rawT = (currentTime - kfA.time) / duration;
  const t = EASING_FUNCTIONS[easing](rawT);

  return {
    x: kfA.x + (kfB.x - kfA.x) * t,
    y: kfA.y + (kfB.y - kfA.y) * t,
  };
}
