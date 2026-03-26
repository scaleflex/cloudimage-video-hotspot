import type { CIVideoHotspotEditor } from './ci-video-hotspot-editor';

export class SelectionManager {
  private selectedHotspotId: string | null = null;
  private selectedPointIndex: number | null = null;
  private editor: CIVideoHotspotEditor;

  constructor(editor: CIVideoHotspotEditor) {
    this.editor = editor;
  }

  select(hotspotId: string, pointIndex?: number): void {
    this.selectedHotspotId = hotspotId;
    this.selectedPointIndex = pointIndex ?? 0;
    this.updateMarkerVisibility();
  }

  selectPoint(hotspotId: string, pointIndex: number): void {
    this.selectedHotspotId = hotspotId;
    this.selectedPointIndex = pointIndex;
    const hotspot = this.editor.getHotspots().find(h => h.id === hotspotId);
    if (hotspot?.keyframes?.[pointIndex]) {
      this.editor.getViewer()?.pause();
      this.editor.getViewer()?.seek(hotspot.keyframes[pointIndex].time);
    }
    this.updateMarkerVisibility();
  }

  deselect(): void {
    this.selectedHotspotId = null;
    this.selectedPointIndex = null;
    this.updateMarkerVisibility();
  }

  getSelectedHotspotId(): string | null {
    return this.selectedHotspotId;
  }

  getSelectedPointIndex(): number | null {
    return this.selectedPointIndex;
  }

  setSelectedPointIndex(index: number | null): void {
    this.selectedPointIndex = index;
  }

  updateMarkerVisibility(): void {
    const mode = this.editor.getMode();
    const markers = document.querySelectorAll('.ci-video-hotspot-marker') as NodeListOf<HTMLElement>;
    markers.forEach((marker) => {
      if (mode === 'editor' && this.selectedHotspotId) {
        const id = marker.getAttribute('data-hotspot-id');
        marker.style.display = id === this.selectedHotspotId ? '' : 'none';
      } else {
        marker.style.display = '';
      }
    });
  }
}
