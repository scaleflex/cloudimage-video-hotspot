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
  private _bufferedEnd = 0;
  private pendingSeek: Promise<void> | null = null;
  private seekGeneration = 0;
  private videoId: string;
  private videoUrl: string;

  constructor(private options: AdapterOptions) {
    super();
    this.videoId = extractVimeoId(options.src) || '';
    this.videoUrl = options.src;
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
    // Use numeric id — fastest path, no oEmbed round-trip.
    this.vimeoPlayer = new Player(this.playerDiv, {
      id: Number(this.videoId),
      width: this.container.clientWidth || 640,
      controls: false,
      autoplay: this.options.autoplay ?? false,
      muted: this.options.muted ?? false,
      loop: this.options.loop ?? false,
    });

    this.bindPlayerEvents();

    this.vimeoPlayer.ready()
      .then(() => this.onPlayerReady())
      .catch((err: unknown) => {
        // Some Vimeo videos fail oEmbed lookup (404) but work as direct
        // iframe embeds.  Fall back to creating an iframe manually and
        // wrapping it with the SDK.
        console.warn('CIVideoHotspot: Vimeo SDK id-based init failed, trying iframe fallback', err);
        this.createPlayerViaIframe(Player);
      });
  }

  /**
   * Fallback: build an iframe ourselves and let the SDK wrap it.
   * This bypasses the oEmbed lookup that some videos don't support.
   */
  private createPlayerViaIframe(Player: any): void {
    // Clean up the failed player (events bound to it are discarded with it)
    try { this.vimeoPlayer?.destroy(); } catch { /* ignore */ }
    this.playerDiv.innerHTML = '';

    const params = new URLSearchParams({
      controls: '0',
      autoplay: this.options.autoplay ? '1' : '0',
      muted: this.options.muted ? '1' : '0',
      loop: this.options.loop ? '1' : '0',
      playsinline: '1',
    });

    const iframe = document.createElement('iframe');
    iframe.src = `https://player.vimeo.com/video/${this.videoId}?${params}`;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    this.playerDiv.appendChild(iframe);

    // Wrap the existing iframe with the Vimeo SDK
    this.vimeoPlayer = new Player(iframe);

    // Re-bind events to the new player instance
    this.bindPlayerEvents();

    this.vimeoPlayer.ready()
      .then(() => this.onPlayerReady())
      .catch((err2: unknown) => {
        console.error('CIVideoHotspot: Vimeo iframe fallback also failed', err2);
        this.emit('error', err2);
      });
  }

  private onPlayerReady(): Promise<void> {
    this._ready = true;
    return Promise.all([
      this.vimeoPlayer.getDuration(),
      this.vimeoPlayer.getVideoWidth(),
      this.vimeoPlayer.getVideoHeight(),
    ]).then(([d, w, h]: [number, number, number]) => {
      this._duration = d;
      if (w && h) this._aspectRatio = w / h;
      this.emit('loadedmetadata');
      this.emit('durationchange', d);
      // Clear the initial loading spinner — video metadata is ready.
      // Use 'seeked' instead of 'playing' so --has-played is not set
      // prematurely (prevents double spinner on first play).
      this.emit('seeked');
    });
  }

  private bindPlayerEvents(): void {
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

    this.vimeoPlayer.on('progress', (data: { percent: number }) => {
      this._bufferedEnd = data.percent * this._duration;
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
    this._currentTime = clamped;
    this.emit('waiting');
    // Generation counter prevents stale seeks from clearing pendingSeek
    // when a newer seek has already started.
    const gen = ++this.seekGeneration;
    this.pendingSeek = (
      this.vimeoPlayer?.setCurrentTime(clamped)
        .then(() => {
          if (gen === this.seekGeneration) {
            this.pendingSeek = null;
            this.emit('seeked');
          }
        })
        .catch((err: unknown) => {
          if (gen === this.seekGeneration) {
            this.pendingSeek = null;
            this.emit('seeked');
          }
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
    return this._bufferedEnd;
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
