/** Bounding box region in video pixel coordinates */
export interface TrackingRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Single tracking result for one frame */
export interface TrackingResult {
  time: number;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

/** Tracking configuration */
export interface TrackingOptions {
  startTime: number;
  endTime: number;
  fps: number;
  searchRadius: number;
  confidenceThreshold: number;
}

/** Default tracking options */
export const DEFAULT_TRACKING_OPTIONS: TrackingOptions = {
  startTime: 0,
  endTime: 10,
  fps: 5,
  searchRadius: 2.0,
  confidenceThreshold: 0.4,
};

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
  hBins: Float32Array;
  sBins: Float32Array;
  numHBins: number;
  numSBins: number;
}

/** Metadata stored on the hotspot about tracking origin */
export interface TrackingMetadata {
  source: 'browser' | 'import';
  algorithm: string;
  avgConfidence: number;
  region?: TrackingRegion;
  trackedAt: string;
}

/** Progress callback payload */
export interface TrackingProgress {
  currentFrame: number;
  totalFrames: number;
  currentTime: number;
  confidence: number;
  percent: number;
}
