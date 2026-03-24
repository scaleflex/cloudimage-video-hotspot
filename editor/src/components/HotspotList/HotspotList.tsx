import React from 'react';
import { useEditor } from '../../state/EditorContext';
import { getHotspots } from '../../state/editorReducer';
import { selectHotspot, removeHotspot, addHotspot, setGlobalTrigger } from '../../state/actions';
import { HotspotListItem } from './HotspotListItem';

export function HotspotList() {
  const { state, dispatch } = useEditor();
  const hotspots = getHotspots(state);
  const sorted = [...hotspots].sort((a, b) => a.startTime - b.startTime);

  const handleAdd = () => {
    const id = `hotspot-${Date.now()}`;
    dispatch(addHotspot({
      id,
      x: '50%',
      y: '50%',
      startTime: Math.max(0, state.currentTime),
      endTime: Math.min(state.duration || 30, state.currentTime + 5),
      label: `Hotspot ${hotspots.length + 1}`,
    }));
  };

  return (
    <div className="editor-panel editor-hotspot-list">
      <div className="editor-panel__header">
        <span>Hotspots ({hotspots.length})</span>
        <button className="editor-btn editor-btn--primary" onClick={handleAdd} style={{ padding: '2px 8px', fontSize: '11px' }}>
          + Add
        </button>
      </div>
      <div className="editor-global-trigger">
        <span className="editor-global-trigger__label">Trigger</span>
        <div className="editor-global-trigger__toggle">
          <button
            className={`editor-global-trigger__btn${state.globalTrigger === 'click' ? ' editor-global-trigger__btn--active' : ''}`}
            onClick={() => dispatch(setGlobalTrigger('click'))}
          >
            Click
          </button>
          <button
            className={`editor-global-trigger__btn${state.globalTrigger === 'hover' ? ' editor-global-trigger__btn--active' : ''}`}
            onClick={() => dispatch(setGlobalTrigger('hover'))}
          >
            Hover
          </button>
        </div>
      </div>
      {sorted.map(h => (
        <HotspotListItem
          key={h.id}
          hotspot={h}
          selected={state.selectedId === h.id}
          onSelect={() => dispatch(selectHotspot(h.id))}
          onDelete={() => dispatch(removeHotspot(h.id))}
        />
      ))}
      {hotspots.length === 0 && (
        <div style={{ padding: 16, color: 'var(--editor-text-muted)', fontSize: 13, textAlign: 'center' }}>
          Click on the video to add a hotspot, or press "+ Add" above.
        </div>
      )}
    </div>
  );
}
