import type { Keyframe } from '../core/types';
import type { CIVideoHotspotEditor } from './ci-video-hotspot-editor';

export class DragManager {
  private editor: CIVideoHotspotEditor;
  private bound = false;

  constructor(editor: CIVideoHotspotEditor) {
    this.editor = editor;
  }

  setup(): void {
    if (this.bound) return;
    this.bound = true;

    const videoArea = this.editor.getVideoAreaEl();
    let dragId: string | null = null;
    let startX = 0, startY = 0;
    let isDragging = false;

    videoArea.addEventListener('pointerdown', (e) => {
      if (this.editor.getMode() !== 'editor') return;
      const marker = (e.target as HTMLElement).closest('.ci-video-hotspot-marker') as HTMLElement;
      if (!marker) return;

      const id = marker.getAttribute('data-hotspot-id');
      if (!id) return;

      dragId = id;
      startX = e.clientX;
      startY = e.clientY;
      isDragging = false;
      marker.setPointerCapture(e.pointerId);

      // Select hotspot; match current time to a keyframe
      const selection = this.editor.getSelection();
      selection.select(id);
      const hotspot = this.editor.getHotspots().find(h => h.id === id);
      const currentTime = this.editor.getViewer()?.getCurrentTime() ?? 0;
      const matchIdx = hotspot?.keyframes?.findIndex(kf => Math.abs(kf.time - currentTime) < 0.25) ?? -1;
      selection.setSelectedPointIndex(matchIdx >= 0 ? matchIdx : null);
      this.editor.refresh();
    });

    videoArea.addEventListener('pointermove', (e) => {
      if (!dragId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!isDragging && Math.abs(dx) + Math.abs(dy) < 3) return;
      if (!isDragging) {
        this.editor.getViewer()?.closeAll();
        const m = document.querySelector(`[data-hotspot-id="${dragId}"]`) as HTMLElement;
        if (m) m.style.pointerEvents = 'none';
      }
      isDragging = true;

      const rect = this.editor.getVideoRect();
      if (!rect) return;
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

      const marker = document.querySelector(`[data-hotspot-id="${dragId}"]`) as HTMLElement;
      if (marker) {
        marker.style.left = `${x}%`;
        marker.style.top = `${y}%`;
      }
    });

    videoArea.addEventListener('pointerup', (e) => {
      if (dragId) {
        const m = document.querySelector(`[data-hotspot-id="${dragId}"]`) as HTMLElement;
        if (m) m.style.pointerEvents = '';
      }
      if (!dragId || !isDragging) {
        dragId = null;
        return;
      }

      const rect = this.editor.getVideoRect();
      if (!rect) { dragId = null; return; }
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

      const hotspot = this.editor.getHotspots().find(h => h.id === dragId);
      const finishedId = dragId;
      dragId = null;
      isDragging = false;

      const selection = this.editor.getSelection();
      this.editor.pushUndo();

      if (hotspot?.keyframes) {
        const roundedX = `${Math.round(x * 100) / 100}%`;
        const roundedY = `${Math.round(y * 100) / 100}%`;
        const selectedPointIndex = selection.getSelectedPointIndex();

        if (selection.getSelectedHotspotId() === finishedId && selectedPointIndex !== null && hotspot.keyframes[selectedPointIndex]) {
          hotspot.keyframes[selectedPointIndex].x = roundedX;
          hotspot.keyframes[selectedPointIndex].y = roundedY;
        } else {
          const currentTime = this.editor.getViewer()?.getCurrentTime() ?? 0;
          const roundedTime = Math.round(currentTime * 10) / 10;
          const newKf: Keyframe = { time: roundedTime, x: roundedX, y: roundedY };
          hotspot.keyframes.push(newKf);
          hotspot.keyframes.sort((a, b) => a.time - b.time);
          hotspot.startTime = hotspot.keyframes[0].time;
          hotspot.endTime = hotspot.keyframes[hotspot.keyframes.length - 1].time;
          selection.setSelectedPointIndex(hotspot.keyframes.indexOf(newKf));
        }

        hotspot.x = hotspot.keyframes[0].x;
        hotspot.y = hotspot.keyframes[0].y;
      }

      this.editor.syncHotspot(finishedId!);
      this.editor.notifyChange();
    });
  }
}
