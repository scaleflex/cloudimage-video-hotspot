import type { TrackingRegion } from './types';

/**
 * Canvas overlay for drawing a bounding box around the target object.
 */
export class RegionSelector {
  private overlay: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private active = false;
  private dragging = false;
  private startX = 0;
  private startY = 0;

  constructor(
    private container: HTMLElement,
    private videoEl: HTMLVideoElement,
    private onSelected: (region: TrackingRegion) => void,
  ) {
    this.overlay = document.createElement('canvas');
    this.overlay.className = 'ci-editor-tracking-overlay';
    this.overlay.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;cursor:crosshair;z-index:100;';
    this.ctx = this.overlay.getContext('2d')!;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
  }

  activate(): void {
    if (this.active) return;
    this.active = true;

    const rect = this.container.getBoundingClientRect();
    this.overlay.width = rect.width;
    this.overlay.height = rect.height;

    this.container.appendChild(this.overlay);
    this.overlay.addEventListener('pointerdown', this.onPointerDown);
    this.overlay.addEventListener('pointermove', this.onPointerMove);
    this.overlay.addEventListener('pointerup', this.onPointerUp);
  }

  deactivate(): void {
    if (!this.active) return;
    this.active = false;
    this.overlay.removeEventListener('pointerdown', this.onPointerDown);
    this.overlay.removeEventListener('pointermove', this.onPointerMove);
    this.overlay.removeEventListener('pointerup', this.onPointerUp);
    this.overlay.remove();
  }

  private onPointerDown(e: PointerEvent): void {
    this.dragging = true;
    this.overlay.setPointerCapture(e.pointerId);
    const rect = this.overlay.getBoundingClientRect();
    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.dragging) return;
    const rect = this.overlay.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    this.drawRect(this.startX, this.startY, currentX, currentY);
  }

  private onPointerUp(e: PointerEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    this.overlay.releasePointerCapture(e.pointerId);

    const rect = this.overlay.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    // Convert display coordinates to video pixel coordinates
    const scaleX = this.videoEl.videoWidth / rect.width;
    const scaleY = this.videoEl.videoHeight / rect.height;

    const x = Math.min(this.startX, endX) * scaleX;
    const y = Math.min(this.startY, endY) * scaleY;
    const width = Math.abs(endX - this.startX) * scaleX;
    const height = Math.abs(endY - this.startY) * scaleY;

    // Minimum size check
    if (width < 10 || height < 10) return;

    const region: TrackingRegion = {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    };

    this.onSelected(region);
  }

  private drawRect(x1: number, y1: number, x2: number, y2: number): void {
    this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);

    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(0, 0, this.overlay.width, this.overlay.height);

    // Clear selected area
    const rx = Math.min(x1, x2);
    const ry = Math.min(y1, y2);
    const rw = Math.abs(x2 - x1);
    const rh = Math.abs(y2 - y1);
    this.ctx.clearRect(rx, ry, rw, rh);

    // Border
    this.ctx.strokeStyle = '#3b82f6';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([4, 4]);
    this.ctx.strokeRect(rx, ry, rw, rh);

    // Corner handles
    this.ctx.setLineDash([]);
    this.ctx.fillStyle = '#3b82f6';
    const hs = 6;
    this.ctx.fillRect(rx - hs / 2, ry - hs / 2, hs, hs);
    this.ctx.fillRect(rx + rw - hs / 2, ry - hs / 2, hs, hs);
    this.ctx.fillRect(rx - hs / 2, ry + rh - hs / 2, hs, hs);
    this.ctx.fillRect(rx + rw - hs / 2, ry + rh - hs / 2, hs, hs);
  }

  destroy(): void {
    this.deactivate();
  }
}
