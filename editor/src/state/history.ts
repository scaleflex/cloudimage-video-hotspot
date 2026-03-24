import type { VideoHotspotItem } from 'js-cloudimage-video-hotspot';

export interface HistoryEntry {
  hotspots: VideoHotspotItem[];
}

export interface HistoryState {
  past: HistoryEntry[];
  present: HistoryEntry;
  future: HistoryEntry[];
}

const MAX_HISTORY = 50;

export function createHistoryState(hotspots: VideoHotspotItem[]): HistoryState {
  return {
    past: [],
    present: { hotspots },
    future: [],
  };
}

export function pushHistory(state: HistoryState, newHotspots: VideoHotspotItem[]): HistoryState {
  const past = [...state.past, state.present].slice(-MAX_HISTORY);
  return {
    past,
    present: { hotspots: newHotspots },
    future: [],
  };
}

export function undoHistory(state: HistoryState): HistoryState {
  if (state.past.length === 0) return state;
  const previous = state.past[state.past.length - 1];
  const newPast = state.past.slice(0, -1);
  return {
    past: newPast,
    present: previous,
    future: [state.present, ...state.future],
  };
}

export function redoHistory(state: HistoryState): HistoryState {
  if (state.future.length === 0) return state;
  const next = state.future[0];
  const newFuture = state.future.slice(1);
  return {
    past: [...state.past, state.present],
    present: next,
    future: newFuture,
  };
}
