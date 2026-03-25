import type { VideoHotspotItem, TriggerMode, Placement, MarkerStyle } from '../core/types';

/** Editor configuration */
export interface EditorConfig {
  /** Video source URL */
  src: string;
  /** Initial hotspots to load into the editor */
  hotspots?: VideoHotspotItem[];
  /** Load sample hotspots (default: false) */
  sampleHotspots?: boolean;
  /** Default trigger mode (default: 'hover') */
  defaultTrigger?: TriggerMode;
  /** Default placement for popovers (default: 'top') */
  defaultPlacement?: Placement;
  /** Default marker style (default: 'dot') */
  defaultMarkerStyle?: MarkerStyle;
  /** Pause video on hotspot interact (default: true) */
  pauseOnInteract?: boolean;
  /** Maximum undo history size (default: 50) */
  maxHistory?: number;
  /** Called whenever hotspots change */
  onChange?: (hotspots: VideoHotspotItem[]) => void;
}

/** App-level mode */
export type EditorMode = 'view' | 'editor';

/** Tool within editor mode */
export type EditorTool = 'select' | 'add';

/** Snapshot of editor state for undo/redo */
export interface EditorSnapshot {
  hotspots: VideoHotspotItem[];
  selectedHotspotId: string | null;
  selectedPointIndex: number | null;
}

/** Editor event names */
export type EditorEvent =
  | 'hotspot:add'
  | 'hotspot:remove'
  | 'hotspot:update'
  | 'hotspot:select'
  | 'hotspot:deselect'
  | 'mode:change'
  | 'tool:change'
  | 'history:change'
  | 'change';
