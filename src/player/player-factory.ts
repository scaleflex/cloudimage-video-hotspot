import { VideoPlayerAdapter, AdapterOptions } from './adapter';
import { HTML5Adapter } from './adapters/html5-adapter';
import { HLSAdapter } from './adapters/hls-adapter';
import { YouTubeAdapter } from './adapters/youtube-adapter';
import { VimeoAdapter } from './adapters/vimeo-adapter';
import type { PlayerType, HLSConfig } from '../core/types';

/**
 * Creates the appropriate adapter based on playerType or auto-detection.
 *
 * All adapters are statically imported — they are lightweight wrappers.
 * The heavy third-party SDKs (hls.js, @vimeo/player, YouTube IFrame API)
 * are loaded asynchronously inside each adapter's mount() method,
 * so they are never bundled.
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
      case 'hls':
        return new HLSAdapter(options, hlsConfig);
      case 'youtube':
        return new YouTubeAdapter(options);
      case 'vimeo':
        return new VimeoAdapter(options);
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
