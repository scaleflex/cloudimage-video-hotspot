import { VideoPlayerAdapter, AdapterOptions } from './adapter';
import { HTML5Adapter } from './adapters/html5-adapter';
import type { PlayerType, HLSConfig } from '../core/types';

/**
 * Creates the appropriate adapter based on playerType or auto-detection.
 *
 * Non-HTML5 adapter modules are imported via require() which Vite/Webpack
 * inlines into the bundle. True code-splitting is not possible here because
 * the factory is synchronous. The heavy third-party SDKs (hls.js,
 * @vimeo/player, YouTube IFrame API) are loaded asynchronously inside each
 * adapter's mount() method — so they are never bundled.
 */
export class PlayerFactory {
  static create(
    options: AdapterOptions,
    playerType: PlayerType = 'auto',
    hlsConfig?: HLSConfig,
  ): VideoPlayerAdapter {
    const type = playerType === 'auto'
      ? PlayerFactory.detect(options.src)
      : playerType;

    switch (type) {
      case 'hls': {
        const { HLSAdapter } = require('./adapters/hls-adapter');
        return new HLSAdapter(options, hlsConfig);
      }
      case 'youtube': {
        const { YouTubeAdapter } = require('./adapters/youtube-adapter');
        return new YouTubeAdapter(options);
      }
      case 'vimeo': {
        const { VimeoAdapter } = require('./adapters/vimeo-adapter');
        return new VimeoAdapter(options);
      }
      default:
        return new HTML5Adapter(options);
    }
  }

  /** Auto-detect player type from the source URL */
  static detect(src: string): PlayerType {
    if (isHLSUrl(src)) return 'hls';
    if (isYouTubeUrl(src)) return 'youtube';
    if (isVimeoUrl(src)) return 'vimeo';
    return 'html5';
  }
}

export function isHLSUrl(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url);
}

export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)\//i.test(url);
}

export function isVimeoUrl(url: string): boolean {
  return /(?:vimeo\.com|player\.vimeo\.com)\//i.test(url);
}
