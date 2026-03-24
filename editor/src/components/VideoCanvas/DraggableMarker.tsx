import React, { useCallback, useRef } from 'react';
import type { VideoHotspotItem } from 'js-cloudimage-video-hotspot';
import { useEditor } from '../../state/EditorContext';
import { updateHotspot } from '../../state/actions';

interface DraggableMarkerProps {
  hotspot: VideoHotspotItem;
  selected: boolean;
  onSelect: () => void;
}

function parsePercent(val: string | number): number {
  if (typeof val === 'number') return val;
  return parseFloat(val) || 0;
}

export function DraggableMarker({ hotspot, selected, onSelect }: DraggableMarkerProps) {
  const { dispatch } = useEditor();
  const dragging = useRef(false);

  const x = parsePercent(hotspot.x);
  const y = parsePercent(hotspot.y);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect();
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [onSelect]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const overlay = (e.target as HTMLElement).parentElement;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    const newX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const newY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    dispatch(updateHotspot(hotspot.id, {
      x: `${newX.toFixed(1)}%`,
      y: `${newY.toFixed(1)}%`,
    }));
  }, [hotspot.id, dispatch]);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div
      className={`editor-canvas__marker ${selected ? 'editor-canvas__marker--selected' : ''}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      title={hotspot.label}
    />
  );
}
