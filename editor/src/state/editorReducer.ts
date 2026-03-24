import type { VideoHotspotItem } from 'js-cloudimage-video-hotspot';
import type { EditorAction, EditorMode } from './actions';
import { createHistoryState, pushHistory, undoHistory, redoHistory, type HistoryState } from './history';

export interface EditorState {
  videoUrl: string;
  selectedId: string | null;
  currentTime: number;
  duration: number;
  playing: boolean;
  mode: EditorMode;
  history: HistoryState;
  globalTrigger: 'click' | 'hover';
}

export function getHotspots(state: EditorState): VideoHotspotItem[] {
  return state.history.present.hotspots;
}

export function canUndo(state: EditorState): boolean {
  return state.history.past.length > 0;
}

export function canRedo(state: EditorState): boolean {
  return state.history.future.length > 0;
}

const DEFAULT_VIDEO = '/demo/3250231-uhd_3840_2160_25fps.mp4';

export function createInitialState(): EditorState {
  return {
    videoUrl: DEFAULT_VIDEO,
    selectedId: null,
    currentTime: 0,
    duration: 0,
    playing: false,
    mode: 'edit',
    history: createHistoryState([]),
    globalTrigger: 'click',
  };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_VIDEO_URL':
      return { ...state, videoUrl: action.url };

    case 'ADD_HOTSPOT': {
      const hotspots = [...getHotspots(state), action.hotspot];
      return { ...state, history: pushHistory(state.history, hotspots), selectedId: action.hotspot.id };
    }

    case 'REMOVE_HOTSPOT': {
      const hotspots = getHotspots(state).filter(h => h.id !== action.id);
      const selectedId = state.selectedId === action.id ? null : state.selectedId;
      return { ...state, history: pushHistory(state.history, hotspots), selectedId };
    }

    case 'UPDATE_HOTSPOT': {
      const hotspots = getHotspots(state).map(h =>
        h.id === action.id ? { ...h, ...action.updates } : h
      );
      return { ...state, history: pushHistory(state.history, hotspots) };
    }

    case 'SELECT_HOTSPOT':
      return { ...state, selectedId: action.id };

    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.time };

    case 'SET_DURATION':
      return { ...state, duration: action.duration };

    case 'SET_PLAYING':
      return { ...state, playing: action.playing };

    case 'SET_MODE':
      return { ...state, mode: action.mode };

    case 'DUPLICATE_HOTSPOT': {
      const source = getHotspots(state).find(h => h.id === action.id);
      if (!source) return state;
      const newId = `hs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const clone = { ...source, id: newId, label: `${source.label} (copy)` };
      const hotspots = [...getHotspots(state), clone];
      return { ...state, history: pushHistory(state.history, hotspots), selectedId: newId };
    }

    case 'RESET':
      return createInitialState();

    case 'IMPORT': {
      return {
        ...state,
        videoUrl: action.videoUrl ?? state.videoUrl,
        history: createHistoryState(action.hotspots),
        selectedId: null,
      };
    }

    case 'SET_GLOBAL_TRIGGER':
      return { ...state, globalTrigger: action.trigger };

    case 'UNDO':
      return { ...state, history: undoHistory(state.history) };

    case 'REDO':
      return { ...state, history: redoHistory(state.history) };

    default:
      return state;
  }
}
