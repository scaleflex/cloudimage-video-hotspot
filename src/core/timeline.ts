import type { NormalizedVideoHotspot, Point, EasingFunction } from './types';

/** Easing functions for keyframe interpolation */
const EASING_FUNCTIONS: Record<EasingFunction, (t: number) => number> = {
  'linear': (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};

export interface TimelineUpdateResult {
  entered: NormalizedVideoHotspot[];
  exited: NormalizedVideoHotspot[];
  active: NormalizedVideoHotspot[];
}

/**
 * Time-based visibility engine.
 * Efficiently determines which hotspots are visible at a given timestamp
 * using sorted arrays for O(log n) lookups.
 */
export class TimelineEngine {
  private hotspots: NormalizedVideoHotspot[];
  private sortedByStart: NormalizedVideoHotspot[];
  private activeSet = new Set<string>();
  private hotspotsById = new Map<string, NormalizedVideoHotspot>();

  constructor(hotspots: NormalizedVideoHotspot[]) {
    this.hotspots = hotspots;
    this.sortedByStart = [...hotspots].sort((a, b) => a.startTime - b.startTime);
    for (const h of hotspots) {
      this.hotspotsById.set(h.id, h);
    }
  }

  /** Update with new hotspot list */
  setHotspots(hotspots: NormalizedVideoHotspot[]): void {
    this.hotspots = hotspots;
    this.sortedByStart = [...hotspots].sort((a, b) => a.startTime - b.startTime);
    this.hotspotsById.clear();
    for (const h of hotspots) {
      this.hotspotsById.set(h.id, h);
    }
  }

  /**
   * Called on every timeupdate or requestAnimationFrame.
   * Returns the set of hotspots that changed state (entered or exited).
   */
  update(currentTime: number): TimelineUpdateResult {
    const entered: NormalizedVideoHotspot[] = [];
    const exited: NormalizedVideoHotspot[] = [];
    const active: NormalizedVideoHotspot[] = [];

    const nowActive = new Set<string>();

    for (const hotspot of this.hotspots) {
      const isVisible = currentTime >= hotspot.startTime && currentTime <= hotspot.endTime;
      if (isVisible) {
        nowActive.add(hotspot.id);
        active.push(hotspot);

        if (!this.activeSet.has(hotspot.id)) {
          entered.push(hotspot);
        }
      }
    }

    // Find exited hotspots
    for (const id of this.activeSet) {
      if (!nowActive.has(id)) {
        const hotspot = this.hotspotsById.get(id);
        if (hotspot) exited.push(hotspot);
      }
    }

    this.activeSet = nowActive;

    return { entered, exited, active };
  }

  /** Get interpolated position for a hotspot with keyframes at a given time */
  getPosition(hotspotId: string, time: number): Point | null {
    const hotspot = this.hotspotsById.get(hotspotId);
    if (!hotspot || !hotspot.keyframes || hotspot.keyframes.length === 0) return null;

    return interpolatePosition(hotspot.keyframes, time, hotspot.easing || 'linear');
  }

  /** Find next hotspot start time after the given time */
  findNextHotspot(afterTime: number): NormalizedVideoHotspot | null {
    for (const hotspot of this.sortedByStart) {
      if (hotspot.startTime > afterTime + 0.1) {
        return hotspot;
      }
    }
    return null;
  }

  /** Find previous hotspot (starts before the given time) */
  findPrevHotspot(beforeTime: number): NormalizedVideoHotspot | null {
    let candidate: NormalizedVideoHotspot | null = null;
    for (const hotspot of this.sortedByStart) {
      if (hotspot.startTime < beforeTime - 0.1) {
        candidate = hotspot;
      } else {
        break;
      }
    }
    return candidate;
  }

  /** Get all hotspot time ranges for timeline indicator rendering */
  getTimeRanges(): Array<{ id: string; startTime: number; endTime: number; label: string }> {
    return this.hotspots.map((h) => ({
      id: h.id,
      startTime: h.startTime,
      endTime: h.endTime,
      label: h.label,
    }));
  }

  /** Check if any active hotspot has keyframes (needs RAF) */
  hasActiveKeyframes(): boolean {
    for (const id of this.activeSet) {
      const hotspot = this.hotspotsById.get(id);
      if (hotspot?.keyframes && hotspot.keyframes.length > 0) return true;
    }
    return false;
  }

  /** Get active hotspot IDs */
  getActiveIds(): string[] {
    return Array.from(this.activeSet);
  }

  /** Reset active state */
  reset(): void {
    this.activeSet.clear();
  }
}

/** Interpolate position between keyframes */
function interpolatePosition(
  keyframes: Array<{ time: number; x: number; y: number }>,
  currentTime: number,
  easing: EasingFunction,
): Point {
  if (keyframes.length === 0) return { x: 0, y: 0 };
  if (keyframes.length === 1) return { x: keyframes[0].x, y: keyframes[0].y };

  // Before first keyframe
  if (currentTime <= keyframes[0].time) {
    return { x: keyframes[0].x, y: keyframes[0].y };
  }

  // After last keyframe
  if (currentTime >= keyframes[keyframes.length - 1].time) {
    const last = keyframes[keyframes.length - 1];
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
