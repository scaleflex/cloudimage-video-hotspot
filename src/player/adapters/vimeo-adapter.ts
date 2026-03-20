import { VideoPlayerAdapter, AdapterOptions } from '../adapter';
import { createElement } from '../../utils/dom';

/**
 * Vimeo Player SDK adapter.
 * Dynamic-imports @vimeo/player — it must be installed as a peer dependency.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Vimeo Player SDK types are not available at compile time
export class VimeoAdapter extends VideoPlayerAdapter {
  private container!: HTMLDivElement;
  private playerDiv!: HTMLDivElement;
  private vimeoPlayer: any = null;
  private _ready = false;
  private _duration = 0;
  private _currentTime = 0;
  private _paused = true;
  private _volume = 1;
  private _muted = false;
  private _playbackRate = 1;
  private _aspectRatio: number | null = null;
  private pendingSeek: Promise<void> | null = null;
  private videoId: string;

  constructor(private options: AdapterOptions) {
    super();
    this.videoId = extractVimeoId(options.src) || '';
    this._muted = options.muted ?? false;
  }

  mount(container: HTMLElement): void {
    this.container = createElement('div', 'ci-video-hotspot-video');
    this.container.style.width = '100%';
    this.container.style.height = '100%';

    this.playerDiv = createElement('div');
    this.playerDiv.style.width = '100%';
    this.playerDiv.style.height = '100%';
    this.container.appendChild(this.playerDiv);
    container.appendChild(this.container);

    // Show loading state immediately — Vimeo needs to load SDK + iframe + buffer
    this.emit('waiting');
    this.loadVimeoSDK();
  }

  private async loadVimeoSDK(): Promise<void> {
    try {
      const { default: Player } = await import('@vimeo/player');
      this.createPlayer(Player);
    } catch {
      // Fallback: try loading from CDN
      try {
        await this.loadVimeoScript();
        const Player = (window as any).Vimeo?.Player;
        if (Player) {
          this.createPlayer(Player);
        } else {
          console.warn('CIVideoHotspot: Vimeo Player SDK not available');
        }
      } catch {
        console.warn(
          'CIVideoHotspot: @vimeo/player not found. Install: npm i @vimeo/player'
        );
      }
    }
  }

  private loadVimeoScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src*="player.vimeo.com/api"]')) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://player.vimeo.com/api/player.js';
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }

  private createPlayer(Player: any): void {
    this.vimeoPlayer = new Player(this.playerDiv, {
      id: Number(this.videoId),
      width: this.container.clientWidth || 640,
      controls: false,
      autoplay: this.options.autoplay ?? false,
      muted: this.options.muted ?? false,
      loop: this.options.loop ?? false,
    });

    this.vimeoPlayer.ready().then(() => {
      this._ready = true;
      Promise.all([
        this.vimeoPlayer.getDuration(),
        this.vimeoPlayer.getVideoWidth(),
        this.vimeoPlayer.getVideoHeight(),
      ]).then(([d, w, h]: [number, number, number]) => {
        this._duration = d;
        if (w && h) this._aspectRatio = w / h;
        this.emit('loadedmetadata');
        this.emit('durationchange', d);
        // Clear the initial loading spinner — video is ready to play
        this.emit('playing');
      });
    });

    this.vimeoPlayer.on('play', () => {
      this._paused = false;
      this.emit('play');
      this.emit('playing');
    });

    this.vimeoPlayer.on('pause', () => {
      this._paused = true;
      this.emit('pause');
    });

    this.vimeoPlayer.on('timeupdate', (data: { seconds: number }) => {
      this._currentTime = data.seconds;
      this.emit('timeupdate', data.seconds);
    });

    this.vimeoPlayer.on('ended', () => {
      this._paused = true;
      this.emit('ended');
    });

    this.vimeoPlayer.on('bufferstart', () => {
      this.emit('waiting');
    });

    this.vimeoPlayer.on('progress', () => {
      this.emit('progress');
    });

    this.vimeoPlayer.on('error', (err: any) => {
      this.emit('error', err);
    });

    // Sync volume changes made via Vimeo's own UI
    this.vimeoPlayer.on('volumechange', (data: { volume: number }) => {
      this._volume = data.volume;
      this.emit('volumechange');
    });

    // Track playback rate changes
    this.vimeoPlayer.on('playbackratechange', (data: { playbackRate: number }) => {
      this._playbackRate = data.playbackRate;
      this.emit('ratechange');
    });
  }

  // --- Adapter interface ---

  get ready(): boolean { return this._ready; }

  play(): Promise<void> {
    // Update state optimistically so isPaused() reflects intent immediately,
    // preventing togglePlay() from calling play() again while waiting for
    // Vimeo's async confirmation event.
    this._paused = false;

    const doPlay = (): Promise<void> =>
      this.vimeoPlayer?.play().catch((err: unknown) => {
        console.warn('CIVideoHotspot: Vimeo play() failed', err);
        this._paused = true;
      }) ?? Promise.resolve();

    // If a seek is in progress, wait for it to finish before playing.
    // Calling play() while setCurrentTime() is pending confuses the player.
    if (this.pendingSeek) {
      return this.pendingSeek.then(doPlay);
    }
    return doPlay();
  }

  pause(): void {
    this._paused = true;
    this.vimeoPlayer?.pause().catch((err: unknown) => {
      console.warn('CIVideoHotspot: Vimeo pause() failed', err);
      this._paused = false;
    });
  }

  seek(time: number): void {
    const clamped = Math.max(0, Math.min(time, this._duration));
    // Update cached time immediately so the progress bar doesn't snap back
    // to the old position while waiting for Vimeo's async setCurrentTime.
    this._currentTime = clamped;
    // Show loading state while Vimeo buffers the target position
    this.emit('waiting');
    this.pendingSeek = (
      this.vimeoPlayer?.setCurrentTime(clamped)
        .then(() => {
          this.pendingSeek = null;
          // Clear loading state — if paused, no 'playing' event will fire
          // so we must emit it manually to remove the spinner.
          this.emit('playing');
        })
        .catch((err: unknown) => {
          this.pendingSeek = null;
          this.emit('playing');
          console.warn('CIVideoHotspot: Vimeo setCurrentTime() failed', err);
        })
    ) ?? null;
  }

  getCurrentTime(): number { return this._currentTime; }
  getDuration(): number { return this._duration; }

  setVolume(level: number): void {
    const v = Math.max(0, Math.min(1, level));
    this._volume = v;
    this.vimeoPlayer?.setVolume(v).catch(() => {});
    this.emit('volumechange');
  }

  getVolume(): number { return this._volume; }

  setMuted(muted: boolean): void {
    this._muted = muted;
    this.vimeoPlayer?.setVolume(muted ? 0 : this._volume).catch(() => {});
    this.emit('volumechange');
  }

  isMuted(): boolean { return this._muted; }

  setPlaybackRate(rate: number): void {
    this._playbackRate = rate;
    this.vimeoPlayer?.setPlaybackRate(rate).catch(() => {});
    this.emit('ratechange');
  }

  getPlaybackRate(): number {
    return this._playbackRate;
  }

  isPaused(): boolean { return this._paused; }

  getBufferedEnd(): number {
    // Vimeo SDK doesn't expose buffered range synchronously
    return 0;
  }

  getElement(): HTMLElement { return this.container; }

  getAspectRatio(): number | null { return this._aspectRatio; }

  destroy(): void {
    this.vimeoPlayer?.destroy().catch(() => {});
    this.container?.remove();
    this.removeAll();
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

/** Extract Vimeo video ID from URL */
export function extractVimeoId(url: string): string | null {
  const match = url.match(
    /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/
  );
  return match ? match[1] : null;
}
