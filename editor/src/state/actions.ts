import type { VideoHotspotItem } from 'js-cloudimage-video-hotspot';

export type EditorMode = 'edit' | 'preview';

export type EditorAction =
  | { type: 'SET_VIDEO_URL'; url: string }
  | { type: 'ADD_HOTSPOT'; hotspot: VideoHotspotItem }
  | { type: 'REMOVE_HOTSPOT'; id: string }
  | { type: 'UPDATE_HOTSPOT'; id: string; updates: Partial<VideoHotspotItem> }
  | { type: 'SELECT_HOTSPOT'; id: string | null }
  | { type: 'SET_CURRENT_TIME'; time: number }
  | { type: 'SET_DURATION'; duration: number }
  | { type: 'SET_PLAYING'; playing: boolean }
  | { type: 'SET_MODE'; mode: EditorMode }
  | { type: 'IMPORT'; hotspots: VideoHotspotItem[]; videoUrl?: string }
  | { type: 'DUPLICATE_HOTSPOT'; id: string }
  | { type: 'SET_GLOBAL_TRIGGER'; trigger: 'click' | 'hover' }
  | { type: 'RESET' }
  | { type: 'UNDO' }
  | { type: 'REDO' };

// Action creators
export const setVideoUrl = (url: string): EditorAction => ({ type: 'SET_VIDEO_URL', url });

export const addHotspot = (hotspot: VideoHotspotItem): EditorAction => ({ type: 'ADD_HOTSPOT', hotspot });

export const removeHotspot = (id: string): EditorAction => ({ type: 'REMOVE_HOTSPOT', id });

export const updateHotspot = (id: string, updates: Partial<VideoHotspotItem>): EditorAction => ({
  type: 'UPDATE_HOTSPOT', id, updates,
});

export const selectHotspot = (id: string | null): EditorAction => ({ type: 'SELECT_HOTSPOT', id });

export const setCurrentTime = (time: number): EditorAction => ({ type: 'SET_CURRENT_TIME', time });

export const setDuration = (duration: number): EditorAction => ({ type: 'SET_DURATION', duration });

export const setPlaying = (playing: boolean): EditorAction => ({ type: 'SET_PLAYING', playing });

export const setMode = (mode: EditorMode): EditorAction => ({ type: 'SET_MODE', mode });

export const importConfig = (hotspots: VideoHotspotItem[], videoUrl?: string): EditorAction => ({
  type: 'IMPORT', hotspots, videoUrl,
});

export const duplicateHotspot = (id: string): EditorAction => ({ type: 'DUPLICATE_HOTSPOT', id });

export const setGlobalTrigger = (trigger: 'click' | 'hover'): EditorAction => ({
  type: 'SET_GLOBAL_TRIGGER', trigger,
});

export const resetEditor = (): EditorAction => ({ type: 'RESET' });

export const undo = (): EditorAction => ({ type: 'UNDO' });

export const redo = (): EditorAction => ({ type: 'REDO' });
