/**
 * Captures video frames as ImageData by seeking the video and drawing to canvas.
 */
export class FrameExtractor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(private videoEl: HTMLVideoElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = videoEl.videoWidth;
    this.canvas.height = videoEl.videoHeight;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
  }

  /** Test if canvas extraction works (CORS check) */
  canExtract(): boolean {
    try {
      this.ctx.drawImage(this.videoEl, 0, 0, 1, 1);
      this.ctx.getImageData(0, 0, 1, 1);
      return true;
    } catch {
      return false;
    }
  }

  /** Extract a single frame at the given time */
  extractFrame(time: number): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const onSeeked = () => {
        this.videoEl.removeEventListener('seeked', onSeeked);
        try {
          this.ctx.drawImage(this.videoEl, 0, 0, this.canvas.width, this.canvas.height);
          resolve(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        } catch {
          reject(new Error('Cannot extract frame: CORS policy blocks canvas access'));
        }
      };
      this.videoEl.addEventListener('seeked', onSeeked);
      this.videoEl.currentTime = time;
    });
  }

  /** Extract frames in a time range at a given FPS. */
  async *extractFrames(
    startTime: number,
    endTime: number,
    fps: number,
    signal?: AbortSignal,
  ): AsyncGenerator<{ time: number; imageData: ImageData }> {
    const interval = 1 / fps;
    for (let t = startTime; t <= endTime; t += interval) {
      if (signal?.aborted) return;
      const imageData = await this.extractFrame(t);
      yield { time: t, imageData };
    }
  }

  get width(): number { return this.canvas.width; }
  get height(): number { return this.canvas.height; }

  destroy(): void {
    this.canvas.width = 0;
    this.canvas.height = 0;
  }
}
