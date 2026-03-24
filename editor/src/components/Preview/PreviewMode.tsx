import React, { useEffect, useRef } from 'react';
import { useEditor } from '../../state/EditorContext';
import { getHotspots } from '../../state/editorReducer';
import { setMode } from '../../state/actions';

export function PreviewMode() {
  const { state, dispatch } = useEditor();
  const containerRef = useRef<HTMLDivElement>(null);
  const hotspots = getHotspots(state);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !state.videoUrl) return;

    // Dynamically import and create the plugin instance
    let instance: any = null;

    import('js-cloudimage-video-hotspot').then(({ default: CIVideoHotspot }) => {
      instance = new CIVideoHotspot(container, {
        src: state.videoUrl,
        hotspots: hotspots.map(h => ({ ...h })),
        trigger: state.globalTrigger,
        pauseOnInteract: true,
        hotspotNavigation: true,
      });
    }).catch(err => {
      console.error('Preview error:', err);
      container.innerHTML = '<p style="color: #e53e3e; padding: 20px;">Failed to load preview. Check console for details.</p>';
    });

    return () => {
      instance?.destroy();
    };
  }, [state.videoUrl, hotspots]);

  return (
    <div className="editor-preview">
      <button
        className="editor-btn editor-btn--primary editor-preview__back"
        onClick={() => dispatch(setMode('edit'))}
      >
        ← Back to Editor
      </button>
      <div className="editor-preview__container" ref={containerRef} />
    </div>
  );
}
