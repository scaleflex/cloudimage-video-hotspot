import type { ManagerContext, RenderLoopManagerInterface } from './manager-types';
import type { HotspotManager } from './hotspot-manager';
import type { NavigationManager } from './navigation-manager';
import type { Controls } from '../player/controls';

export class RenderLoopManager implements RenderLoopManagerInterface {
  private animFrameId: number | null = null;
  private controls: Controls | null = null;

  constructor(
    private ctx: ManagerContext,
    private hotspotManager: HotspotManager,
    private navigationManager: NavigationManager,
  ) {}

  setControls(controls: Controls | null): void {
    this.controls = controls;
  }

  onTimeUpdate(currentTime: number): void {
    if (this.ctx.isDestroyed()) return;

    this.hotspotManager.processTimeUpdate(currentTime);
    this.navigationManager.updateNavCounter();
  }

  startRenderLoop(): void {
    if (this.animFrameId !== null) return;

    const loop = () => {
      if (this.ctx.isDestroyed()) return;
      if (!this.ctx.player.isPaused()) {
        const currentTime = this.ctx.player.getCurrentTime();
        // Update hotspot positions at high fps when keyframes are active
        if (this.ctx.timeline.hasActiveKeyframes()) {
          this.onTimeUpdate(currentTime);
        }
        // Update progress bar smoothly (not full controls to avoid button re-render)
        this.controls?.progressBar.update(currentTime);
        this.animFrameId = requestAnimationFrame(loop);
      }
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  stopRenderLoop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  destroy(): void {
    this.stopRenderLoop();
  }
}
