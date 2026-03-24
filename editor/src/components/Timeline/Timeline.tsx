import React, { useState, useRef, useCallback } from 'react';
import { useEditor } from '../../state/EditorContext';
import { getHotspots } from '../../state/editorReducer';
import { selectHotspot, setCurrentTime, updateHotspot } from '../../state/actions';
import { useVideoPlayer } from '../../hooks/useVideoPlayer';
import { TimelineRuler } from './TimelineRuler';
import { TimelineTrack } from './TimelineTrack';
import type { VideoHotspotItem } from 'js-cloudimage-video-hotspot';

const ZOOM_LEVELS = [1, 2, 4];

export function Timeline() {
  const { state, dispatch } = useEditor();
  const { seek } = useVideoPlayer();
  const hotspots = getHotspots(state);
  const sorted = [...hotspots].sort((a, b) => a.startTime - b.startTime);
  const [zoomIdx, setZoomIdx] = useState(0);
  const zoomLevel = ZOOM_LEVELS[zoomIdx];
  const playheadDrag = useRef(false);
  const tracksRef = useRef<HTMLDivElement>(null);

  const handleSeek = useCallback((time: number) => {
    seek(time);
    dispatch(setCurrentTime(time));
  }, [seek, dispatch]);

  const handleUpdate = useCallback((id: string, updates: Partial<VideoHotspotItem>) => {
    dispatch(updateHotspot(id, updates));
  }, [dispatch]);

  const playheadPos = state.duration > 0
    ? (state.currentTime / state.duration) * 100
    : 0;

  // Playhead drag handlers
  const handlePlayheadPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playheadDrag.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePlayheadPointerMove = (e: React.PointerEvent) => {
    if (!playheadDrag.current) return;
    const tracks = tracksRef.current;
    if (!tracks) return;
    const rect = tracks.getBoundingClientRect();
    const scrollLeft = tracks.scrollLeft;
    const totalWidth = tracks.scrollWidth;
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left + scrollLeft) / totalWidth));
    handleSeek(frac * state.duration);
  };

  const handlePlayheadPointerUp = (e: React.PointerEvent) => {
    playheadDrag.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const zoomIn = () => setZoomIdx(i => Math.min(i + 1, ZOOM_LEVELS.length - 1));
  const zoomOut = () => setZoomIdx(i => Math.max(i - 1, 0));

  return (
    <div className="editor-timeline">
      <div className="editor-timeline__header">
        <TimelineRuler duration={state.duration} onSeek={handleSeek} zoomLevel={zoomLevel} />
        <div className="editor-timeline__zoom">
          <button className="editor-btn editor-btn--icon" onClick={zoomOut} disabled={zoomIdx === 0} title="Zoom Out">−</button>
          <span className="editor-timeline__zoom-label">{zoomLevel}x</span>
          <button className="editor-btn editor-btn--icon" onClick={zoomIn} disabled={zoomIdx === ZOOM_LEVELS.length - 1} title="Zoom In">+</button>
        </div>
      </div>
      <div className="editor-timeline__scroll-container" ref={tracksRef}>
        <div className="editor-timeline__tracks" style={{ width: `${zoomLevel * 100}%`, position: 'relative' }}>
          {/* Playhead */}
          <div
            className="editor-timeline__playhead"
            style={{ left: `${playheadPos}%` }}
            onPointerDown={handlePlayheadPointerDown}
            onPointerMove={handlePlayheadPointerMove}
            onPointerUp={handlePlayheadPointerUp}
          >
            <div className="editor-timeline__playhead-head" />
          </div>

          {sorted.map(h => (
            <TimelineTrack
              key={h.id}
              hotspot={h}
              duration={state.duration}
              selected={state.selectedId === h.id}
              onSelect={() => dispatch(selectHotspot(h.id))}
              onUpdate={handleUpdate}
              onSeek={handleSeek}
              zoomLevel={zoomLevel}
            />
          ))}

          {hotspots.length === 0 && (
            <div style={{ padding: 16, color: 'var(--editor-text-muted)', fontSize: 12, textAlign: 'center' }}>
              No hotspots yet. Click on the video or use "+ Add" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
