import { useCallback } from 'react';
import { useEditor } from '../state/EditorContext';
import { getHotspots } from '../state/editorReducer';
import { exportToJson, exportToHtml } from '../utils/export';

export function useExport() {
  const { state } = useEditor();

  const downloadJson = useCallback(() => {
    const json = exportToJson(getHotspots(state), state.videoUrl);
    download(json, 'video-hotspots.json', 'application/json');
  }, [state]);

  const downloadHtml = useCallback(() => {
    const html = exportToHtml(getHotspots(state), state.videoUrl);
    download(html, 'video-hotspots.html', 'text/html');
  }, [state]);

  return { downloadJson, downloadHtml };
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
