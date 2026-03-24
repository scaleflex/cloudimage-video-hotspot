import React, { useRef } from 'react';
import { useEditor } from '../../state/EditorContext';
import { getHotspots, canUndo, canRedo } from '../../state/editorReducer';
import { undo, redo, setVideoUrl, setMode, importConfig, resetEditor } from '../../state/actions';
import { useExport } from '../../hooks/useExport';
import { importFromJson, readFileAsText } from '../../utils/import';
import { TEMPLATES } from '../../utils/templates';

export function Toolbar() {
  const { state, dispatch } = useEditor();
  const hotspots = getHotspots(state);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { downloadJson, downloadHtml } = useExport();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const result = importFromJson(text);
      dispatch(importConfig(result.hotspots, result.videoUrl));
    } catch (err) {
      alert(`Import error: ${(err as Error).message}`);
    }
    e.target.value = '';
  };

  const handleTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value, 10);
    if (isNaN(idx)) return;
    const template = TEMPLATES[idx];
    if (template && confirm(`Load "${template.name}" template? This will replace current hotspots.`)) {
      dispatch(importConfig(template.hotspots));
    }
    e.target.value = '';
  };

  return (
    <div className="editor-toolbar">
      <span className="editor-toolbar__title">Video Hotspot Editor</span>

      <div className="editor-toolbar__group">
        <input
          className="editor-input"
          type="text"
          placeholder="Enter video URL..."
          value={state.videoUrl}
          onChange={e => dispatch(setVideoUrl(e.target.value))}
          style={{ width: 300 }}
        />
      </div>

      <div className="editor-toolbar__separator" />

      <div className="editor-toolbar__group">
        <button className="editor-btn" onClick={() => {
          if (confirm('Create new project? This will clear all hotspots and data.')) {
            dispatch(resetEditor());
            try { localStorage.removeItem('editor-state'); } catch {}
          }
        }}>
          New
        </button>
        <button className="editor-btn" onClick={() => fileInputRef.current?.click()}>
          Open JSON
        </button>
        <input ref={fileInputRef} type="file" accept=".json" hidden onChange={handleImport} />
        <button className="editor-btn" onClick={downloadJson} disabled={hotspots.length === 0}>
          Save JSON
        </button>
        <button className="editor-btn" onClick={downloadHtml} disabled={hotspots.length === 0}>
          Export HTML
        </button>
      </div>

      <div className="editor-toolbar__separator" />

      <div className="editor-toolbar__group">
        <button className="editor-btn--icon editor-btn" onClick={() => dispatch(undo())} disabled={!canUndo(state)} title="Undo (Ctrl+Z)">
          ↶
        </button>
        <button className="editor-btn--icon editor-btn" onClick={() => dispatch(redo())} disabled={!canRedo(state)} title="Redo (Ctrl+Shift+Z)">
          ↷
        </button>
      </div>

      <div className="editor-toolbar__separator" />

      <select className="editor-input" style={{ width: 150 }} onChange={handleTemplate} value="">
        <option value="">Templates...</option>
        {TEMPLATES.map((t, i) => (
          <option key={t.name} value={i}>{t.name}</option>
        ))}
      </select>

      <div className="editor-toolbar__spacer" />

      <button
        className={`editor-btn ${state.mode === 'preview' ? 'editor-btn--primary' : ''}`}
        onClick={() => dispatch(setMode(state.mode === 'preview' ? 'edit' : 'preview'))}
      >
        {state.mode === 'preview' ? 'Back to Editor' : 'Preview'}
      </button>
    </div>
  );
}
