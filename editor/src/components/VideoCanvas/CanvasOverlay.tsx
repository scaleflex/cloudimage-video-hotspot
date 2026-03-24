import React from 'react';
import { useEditor } from '../../state/EditorContext';
import { addHotspot, selectHotspot } from '../../state/actions';
import { getHotspots } from '../../state/editorReducer';
import { DraggableMarker } from './DraggableMarker';

interface CanvasOverlayProps {
  videoRect: DOMRect | null;
}

export function CanvasOverlay({ videoRect }: CanvasOverlayProps) {
  const { state, dispatch } = useEditor();
  const hotspots = getHotspots(state);

  // Filter hotspots visible at current time
  const visible = hotspots.filter(h =>
    state.currentTime >= h.startTime && state.currentTime <= h.endTime
  );

  return (
    <div
      className="editor-canvas__overlay"
      style={videoRect ? {
        left: videoRect.left,
        top: videoRect.top,
        width: videoRect.width,
        height: videoRect.height,
        position: 'fixed',
      } : undefined}
    >
      {visible.map(h => (
        <DraggableMarker
          key={h.id}
          hotspot={h}
          selected={state.selectedId === h.id}
          onSelect={() => dispatch(selectHotspot(h.id))}
        />
      ))}
    </div>
  );
}
