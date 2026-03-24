import { useCallback, useRef } from 'react';
import { useEditor } from '../state/EditorContext';
import { updateHotspot } from '../state/actions';

export function useDragMarker(hotspotId: string) {
  const { dispatch } = useEditor();
  const dragging = useRef(false);
  const containerRef = useRef<HTMLElement | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    dispatch(updateHotspot(hotspotId, { x: `${x.toFixed(1)}%`, y: `${y.toFixed(1)}%` }));
  }, [hotspotId, dispatch]);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return { containerRef, onPointerDown, onPointerMove, onPointerUp };
}
