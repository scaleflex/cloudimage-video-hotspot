# js-cloudimage-video-hotspot — Technical Specification

> Version: 2.0.0 (planned)
> Last updated: 2026-02-24
> Status: Draft

---

## Table of Contents

1. [Overview](#1-overview)
2. [Current State (v1.0.0)](#2-current-state-v100)
3. [Competitive Analysis](#3-competitive-analysis)
4. [Roadmap](#4-roadmap)
5. [Phase 1: Multi-Player Adapter (YouTube / Vimeo / HLS)](#5-phase-1-multi-player-adapter)
6. [Phase 2: Enhanced Shoppable Features](#6-phase-2-enhanced-shoppable-features)
7. [Phase 3: Standalone Visual Editor](#7-phase-3-standalone-visual-editor)
8. [Phase 4: Future Features](#8-phase-4-future-features)
9. [Architecture Overview](#9-architecture-overview)
10. [API Reference (Complete)](#10-api-reference-complete)
11. [CSS Custom Properties](#11-css-custom-properties)
12. [Accessibility](#12-accessibility)
13. [Browser Support](#13-browser-support)
14. [Build & Distribution](#14-build--distribution)

---

## 1. Overview

### Vision

Transform any video into a shoppable, interactive experience. The plugin enables time-based hotspots that appear, move, and disappear in sync with video playback — supporting HTML5, YouTube, and Vimeo sources. A standalone visual editor empowers non-technical users to create hotspot configurations without writing code.

### Core Principles

- **Zero runtime dependencies** — pure TypeScript, no frameworks required
- **Lightweight** — under 20 KB gzipped (core library)
- **Accessible by default** — WCAG 2.1 AA compliant
- **Framework-agnostic** — vanilla JS, React, or any framework
- **Open-source** — MIT license, no vendor lock-in
- **Developer-first API** — programmatic control over every aspect
- **E-commerce focused** — shoppable templates, product cards, CTA

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5.5+ |
| Build | Vite 5.4+ (Rollup) |
| Testing | Vitest 2.1+ + Testing Library |
| Linting | ESLint 8 + TypeScript-ESLint |
| Formats | ESM, CJS, UMD |
| React | Optional peer dependency (17+) |
| Editor | React + TypeScript + Vite (separate package) |

---

## 2. Current State (v1.0.0)

### Project Structure

```
js-cloudimage-video-hotspot/
├── src/
│   ├── core/
│   │   ├── ci-video-hotspot.ts    # Main orchestrator class (843 lines)
│   │   ├── types.ts               # TypeScript type definitions
│   │   ├── config.ts              # Configuration validation & merging
│   │   └── timeline.ts            # Timeline engine (visibility detection)
│   ├── markers/
│   │   ├── marker.ts              # Marker creation & DOM management
│   │   └── motion.ts              # Keyframe interpolation engine
│   ├── popover/
│   │   ├── popover.ts             # Popover class & event handling
│   │   ├── template.ts            # Built-in product template
│   │   ├── position.ts            # Auto-positioning (flip/shift)
│   │   └── sanitize.ts            # HTML sanitization (XSS prevention)
│   ├── player/
│   │   ├── video-player.ts        # Native HTML5 video wrapper
│   │   ├── controls.ts            # Control bar (play, volume, speed)
│   │   └── progress-bar.ts        # Progress bar + indicators + chapters
│   ├── fullscreen/
│   │   └── fullscreen.ts          # Fullscreen API wrapper
│   ├── hotspot-nav/
│   │   └── hotspot-nav.ts         # Prev/next navigation + counter
│   ├── a11y/
│   │   ├── keyboard.ts            # Keyboard navigation handler
│   │   ├── aria.ts                # ARIA live regions & announcements
│   │   └── focus.ts               # Focus trap for popovers
│   ├── utils/
│   │   ├── coordinates.ts         # Coordinate normalization
│   │   ├── dom.ts                 # DOM helpers (createElement, addClass, etc.)
│   │   ├── events.ts              # Event listener management
│   │   ├── time.ts                # Time formatting (mm:ss)
│   │   └── cloudimage.ts          # Cloudimage CDN URL builder
│   ├── react/
│   │   ├── index.ts               # React component + hook exports
│   │   ├── use-ci-video-hotspot.ts # Custom React hook
│   │   └── types.ts               # React-specific types
│   ├── styles/
│   │   └── index.css              # Complete stylesheet (855 lines, 79 CSS vars)
│   └── index.ts                   # Library entry point
├── config/
│   ├── vite.config.ts             # Main library build
│   ├── vite.demo.config.ts        # Dev server config
│   └── vite.react.config.ts       # React component build
├── demo/                          # Demo application
├── examples/                      # Vanilla + React examples
├── tests/                         # Unit tests (vitest)
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Existing Features (v1.0.0)

| Feature | Description |
|---------|-------------|
| Time-based hotspots | Appear/disappear at precise `startTime`/`endTime` |
| Keyframe motion | Follow moving objects via interpolated keyframes at 60fps |
| Popover system | Click or hover trigger, auto flip/shift positioning |
| Product template | Built-in template: image, title, price, originalPrice, badge, CTA |
| Marker styles | `dot`, `dot-label`, `icon`, `numbered` with custom CSS class/SVG/URL |
| Pulse animation | Configurable breathe + ring pulse effect |
| Entrance/exit | `fade`, `scale`, `none` animations for hotspot lifecycle |
| Timeline indicators | `dot` or `range` markers on the progress bar |
| Chapters | Named segments, dropdown navigation, progress bar dividers |
| Hotspot navigation | Prev/next buttons with "2 of 7" counter |
| Video controls | Play/pause, volume slider, speed (0.5x-2x), time display, fullscreen |
| Keyboard navigation | Space/K, arrows, N/P, F, M, Escape, Tab |
| ARIA support | Live regions, focus traps, aria-label, role attributes |
| Reduced motion | Respects `prefers-reduced-motion` media query |
| Themes | Light (default) + Dark via CSS variables |
| CSS customization | 79 CSS custom properties for complete visual control |
| React integration | Component (`CIVideoHotspotViewer`), hook (`useCIVideoHotspot`), ref API |
| Auto-init | `data-ci-video-hotspot-*` HTML attributes |
| Cloudimage CDN | Optional poster/thumbnail optimization |
| Runtime API | `addHotspot`, `removeHotspot`, `updateHotspot`, `open`, `close`, etc. |

### Existing Type Definitions

```typescript
// === Enums / Unions ===

type TriggerMode = 'hover' | 'click';
type Placement = 'top' | 'bottom' | 'left' | 'right' | 'auto';
type Theme = 'light' | 'dark';
type MarkerStyle = 'dot' | 'dot-label' | 'icon' | 'numbered';
type HotspotAnimation = 'fade' | 'scale' | 'none';
type EasingFunction = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
type TimelineIndicatorStyle = 'dot' | 'range' | 'none';

// === Data Structures ===

interface Keyframe {
  time: number;
  x: string | number;   // '65%' or 65
  y: string | number;
}

interface PopoverData {
  title?: string;
  price?: string;
  originalPrice?: string;
  description?: string;
  image?: string;
  url?: string;
  ctaText?: string;        // default: 'View details'
  badge?: string;           // e.g. 'NEW', 'SALE', '-30%'
  [key: string]: unknown;   // extensible
}

interface VideoChapter {
  id: string;
  title: string;
  startTime: number;
  endTime?: number;         // auto-calculated if omitted
  thumbnail?: string;
}

interface CloudimageConfig {
  token: string;
  apiVersion?: string;      // default: 'v7'
  domain?: string;          // default: 'cloudimg.io'
  params?: string;          // e.g. 'q=80'
}

// === Hotspot Item ===

interface VideoHotspotItem {
  // Required
  id: string;
  x: string | number;
  y: string | number;
  startTime: number;
  endTime: number;
  label: string;

  // Motion
  keyframes?: Keyframe[];
  easing?: EasingFunction;

  // Content
  data?: PopoverData;
  content?: string;            // raw HTML (sanitized)

  // Visual
  markerStyle?: MarkerStyle;
  className?: string;
  icon?: string;               // CSS class, SVG, or image URL
  animation?: HotspotAnimation;

  // Behavior
  trigger?: TriggerMode;       // override global
  placement?: Placement;       // override global
  pauseOnShow?: boolean;
  pauseOnInteract?: boolean;
  keepOpen?: boolean;
  onClick?: (event: MouseEvent | KeyboardEvent, hotspot: VideoHotspotItem) => void;

  // Grouping
  chapterId?: string;
}

// === Main Configuration ===

interface CIVideoHotspotConfig {
  // Video source
  src: string;                  // required
  sources?: { src: string; type: string }[];
  poster?: string;
  alt?: string;

  // Data
  hotspots: VideoHotspotItem[]; // required
  chapters?: VideoChapter[];

  // Behavior
  trigger?: TriggerMode;        // default: 'click'
  placement?: Placement;        // default: 'top'
  pauseOnInteract?: boolean;    // default: true
  autoplay?: boolean;           // default: false
  loop?: boolean;               // default: false
  muted?: boolean;              // default: false (true if autoplay)

  // Appearance
  theme?: Theme;                // default: 'light'
  pulse?: boolean;              // default: true
  hotspotAnimation?: HotspotAnimation;       // default: 'fade'
  timelineIndicators?: TimelineIndicatorStyle; // default: 'dot'

  // UI visibility
  controls?: boolean;           // default: true
  fullscreenButton?: boolean;   // default: true
  hotspotNavigation?: boolean;  // default: false
  chapterNavigation?: boolean;  // default: true if chapters provided

  // Custom rendering
  renderPopover?: (hotspot: VideoHotspotItem) => string | HTMLElement;
  renderMarker?: (hotspot: VideoHotspotItem) => string | HTMLElement;

  // Callbacks
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onHotspotShow?: (hotspot: VideoHotspotItem) => void;
  onHotspotHide?: (hotspot: VideoHotspotItem) => void;
  onHotspotClick?: (event: MouseEvent | KeyboardEvent, hotspot: VideoHotspotItem) => void;
  onOpen?: (hotspot: VideoHotspotItem) => void;
  onClose?: (hotspot: VideoHotspotItem) => void;
  onChapterChange?: (chapter: VideoChapter) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;

  // Cloudimage
  cloudimage?: CloudimageConfig;
}

// === Instance Methods ===

interface CIVideoHotspotInstance {
  // DOM access
  getElements(): {
    container: HTMLElement;
    video: HTMLVideoElement;
    overlay: HTMLElement;
    controls: HTMLElement | null;
  };

  // Video playback
  play(): void;
  pause(): void;
  togglePlay(): void;
  seek(time: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  setVolume(level: number): void;
  getVolume(): number;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  setPlaybackRate(rate: number): void;
  getPlaybackRate(): number;

  // Hotspot management
  open(id: string): void;
  close(id: string): void;
  closeAll(): void;
  addHotspot(hotspot: VideoHotspotItem): void;
  removeHotspot(id: string): void;
  updateHotspot(id: string, updates: Partial<VideoHotspotItem>): void;
  getVisibleHotspots(): string[];
  getHotspots(): VideoHotspotItem[];

  // Navigation
  nextHotspot(): void;
  prevHotspot(): void;
  goToHotspot(id: string): void;
  goToChapter(id: string): void;
  getCurrentChapter(): string | undefined;

  // Fullscreen
  enterFullscreen(): void;
  exitFullscreen(): void;
  isFullscreen(): boolean;

  // Lifecycle
  update(config: Partial<CIVideoHotspotConfig>): void;
  destroy(): void;
}
```

### Internal Architecture (v1.0.0)

```
CIVideoHotspot (orchestrator)
│
├── VideoPlayer              → Native <video> element wrapper
│   ├── play/pause/seek/volume/speed
│   └── events: onPlay, onPause, onTimeUpdate, onDurationChange
│
├── TimelineEngine           → O(log n) visibility detection
│   ├── update(time) → { entered, exited, active }
│   ├── getPosition(id, time) → { x, y } (interpolated)
│   └── hasActiveKeyframes() → boolean
│
├── Controls                 → Custom video control bar
│   ├── ProgressBar          → Seek bar + buffered + indicators + chapters
│   ├── Play/Pause button
│   ├── Volume slider
│   ├── Speed selector
│   ├── Time display
│   ├── Fullscreen button
│   └── Chapter dropdown
│
├── Markers (Map<id, button>) → Marker DOM elements
│   ├── createMarker()        → dot / dot-label / icon / numbered
│   ├── updateMarkerPosition() → left/top %
│   └── setMarkerActive/Exiting()
│
├── Popovers (Map<id, Popover>) → Popover instances
│   ├── mount(overlay, marker)
│   ├── show/hide/scheduleHide
│   ├── position(flip/shift)
│   └── renderPopoverContent() → template / HTML / custom
│
├── HotspotNav               → Prev/next + counter
├── FullscreenControl         → Fullscreen API wrapper
├── VideoKeyboardHandler      → Keyboard shortcuts
├── FocusTrap                 → Tab containment in popovers
└── ARIA                      → Live region announcements

State:
├── markers: Map<string, HTMLButtonElement>
├── popovers: Map<string, Popover>
├── normalizedHotspots: Map<string, NormalizedVideoHotspot>
├── focusTraps: Map<string, FocusTrap>
├── openPopovers: Set<string>
├── activeTimers: Set<Timer>
├── wasPlayingBeforePause: boolean
└── currentChapterId: string | undefined
```

---

## 3. Competitive Analysis

### Market Landscape

| Platform | Type | Strengths | Weaknesses | Price |
|----------|------|-----------|------------|-------|
| **WIREWAX** (Vimeo) | SaaS | AI object tracking, enterprise-grade | $8000+/video, closed ecosystem | $$$$$ |
| **Cinema8** | SaaS | 500+ widgets, branching, quiz | UI overload, vendor lock-in | $$$ |
| **HapYak** (Brightcove) | SaaS | Analytics, CRM integration | No free tier, legacy UI | $$$$ |
| **Eko** | Platform | Branching narratives, 70%+ engagement | Limited features, low brand awareness | Free |
| **Mindstamp** | SaaS | Affordable, branching + conditional logic | Limited e-commerce | $ |
| **Spott** | SaaS | Shoppable video, multi-channel | No motion tracking, basic | $-$$ |
| **ThingLink** | SaaS | 360/3D/VR support | Basic analytics, expensive | $$ |
| **Hihaho** | SaaS | Diverse hotspot interactions | No motion tracking | $$ |

### Our Competitive Advantages

1. **Zero dependencies + tiny bundle** — competitors require heavy frameworks
2. **Open-source (MIT)** — competitors are expensive SaaS ($15-$8000/month)
3. **WCAG 2.1 AA** — almost no competitor emphasizes accessibility
4. **Developer-friendly API** — full programmatic control, not locked to a UI
5. **Multi-source video** — HTML5 + YouTube + Vimeo (planned)
6. **Visual editor + API** — serves both developers and non-technical users
7. **No vendor lock-in** — JSON config, self-hosted, no account required

### Feature Gap Analysis

| Feature | Competitors | Our Plugin (v1) | Planned (v2) |
|---------|-------------|-----------------|--------------|
| HTML5 video | All | Yes | Yes |
| HLS adaptive streaming | Some | No | **Phase 1** |
| YouTube/Vimeo | Some | No | **Phase 1** |
| Time-based hotspots | All | Yes | Yes |
| Motion tracking (manual) | Few | Yes (keyframes) | Yes |
| Motion tracking (AI) | WIREWAX only | No | Phase 4 |
| Popover/tooltips | All | Yes | Enhanced |
| Product cards | Some | Basic | **Phase 2** |
| Image gallery in popover | Few | No | **Phase 2** |
| Product variants (size/color) | Spott | No | **Phase 2** |
| Cart integration | Spott | No | — (not planned) |
| Branching/routing | Cinema8, Eko | No | Phase 4 |
| Quiz/surveys | Cinema8, HapYak | No | Phase 4 |
| Analytics | Most | No (callbacks only) | Phase 4 |
| Visual editor | All (SaaS) | No | **Phase 3** |
| Accessibility (WCAG) | None | Yes | Yes |
| Themes (light/dark) | Few | Yes | Yes |
| React integration | Few | Yes | Yes |
| CSS customization | Few | 79 variables | Expanded |

---

## 4. Roadmap

```
Phase 1: Multi-Player Adapter (YouTube / Vimeo / HLS)
  └── Adapter pattern for video sources
  └── HLS support via hls.js (primary adaptive format for Filerobot)
  └── YouTube IFrame API integration
  └── Vimeo Player SDK integration
  └── Auto-detection by URL / extension

Phase 2: Enhanced Shoppable Features
  └── Image gallery (swipeable)
  └── Product variants (size, color selectors)
  └── Star rating + review count
  └── Wishlist button
  └── Countdown timer (sale/promo)
  └── Multiple CTAs
  └── onAddToCart callback

Phase 3: Standalone Visual Editor
  └── Drag-and-drop hotspot placement
  └── Timeline editor (startTime/endTime ranges)
  └── Properties panel
  └── Keyframe editor
  └── JSON export/import
  └── Undo/Redo
  └── Templates & presets
  └── YouTube/Vimeo URL input

Phase 4: Future
  └── Analytics (clicks, CTR, heatmap)
  └── Branching (jump to time/video)
  └── Quiz / surveys
  └── Conditional logic
  └── AI hotspot suggestions
```

---

## 5. Phase 1: Multi-Player Adapter

### Goal

Support YouTube, Vimeo, and HLS (.m3u8) videos alongside native HTML5 `<video>`, without breaking existing functionality. HLS is the primary adaptive format used by Filerobot.

### Architecture

```
src/player/
├── adapter.ts                  # VideoPlayerAdapter interface
├── player-factory.ts           # Factory: URL → adapter
├── video-player.ts             # Refactored: thin wrapper using adapter
├── adapters/
│   ├── html5-adapter.ts        # Current <video> logic extracted
│   ├── hls-adapter.ts          # HLS via hls.js (extends HTML5)
│   ├── youtube-adapter.ts      # YouTube IFrame Player API
│   └── vimeo-adapter.ts        # Vimeo Player SDK (@vimeo/player)
└── controls.ts                 # Unchanged (works via adapter)
```

### VideoPlayerAdapter Interface

```typescript
interface VideoPlayerAdapter {
  /** Mount the player into the given container element */
  mount(container: HTMLElement): void;

  /** Start playback */
  play(): Promise<void>;

  /** Pause playback */
  pause(): void;

  /** Seek to time in seconds */
  seek(time: number): void;

  /** Get current playback time in seconds */
  getCurrentTime(): number;

  /** Get total duration in seconds */
  getDuration(): number;

  /** Set volume (0-1) */
  setVolume(level: number): void;

  /** Get volume (0-1) */
  getVolume(): number;

  /** Set muted state */
  setMuted(muted: boolean): void;

  /** Check if muted */
  isMuted(): boolean;

  /** Set playback rate */
  setPlaybackRate(rate: number): void;

  /** Get playback rate */
  getPlaybackRate(): number;

  /** Check if paused */
  isPaused(): boolean;

  /** Get buffered end time in seconds */
  getBufferedEnd(): number;

  /** Subscribe to player events */
  on(event: VideoPlayerEvent, handler: (...args: any[]) => void): void;

  /** Unsubscribe from player events */
  off(event: VideoPlayerEvent, handler: (...args: any[]) => void): void;

  /** Get the DOM element (video, iframe, or container) */
  getElement(): HTMLElement;

  /** Destroy the adapter and clean up */
  destroy(): void;
}

type VideoPlayerEvent =
  | 'play'
  | 'pause'
  | 'timeupdate'
  | 'durationchange'
  | 'loadedmetadata'
  | 'waiting'
  | 'playing'
  | 'ended'
  | 'volumechange'
  | 'ratechange'
  | 'error';

interface VideoPlayerAdapterConfig {
  src: string;
  sources?: { src: string; type: string }[];
  poster?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
}
```

### PlayerFactory

```typescript
class PlayerFactory {
  /**
   * Create the appropriate adapter based on the video source URL.
   *
   * Detection rules:
   *  - URL contains .m3u8 or type is application/x-mpegURL → HLSAdapter
   *  - youtube.com/watch, youtu.be, youtube.com/embed → YouTubeAdapter
   *  - vimeo.com/*, player.vimeo.com/* → VimeoAdapter
   *  - Everything else → HTML5Adapter
   */
  static create(config: VideoPlayerAdapterConfig): VideoPlayerAdapter;

  /** Check if URL is an HLS stream */
  static isHLS(url: string): boolean;

  /** Extract YouTube video ID from URL */
  static extractYouTubeId(url: string): string | null;

  /** Extract Vimeo video ID from URL */
  static extractVimeoId(url: string): string | null;
}
```

### HLS Adapter Details

HLS is the primary adaptive streaming format used by Filerobot. The `HLSAdapter` extends `HTML5Adapter` since it uses the same `<video>` element — it only adds hls.js initialization for browsers without native HLS support.

| Aspect | Implementation |
|--------|---------------|
| Library | `hls.js` (~70KB gzipped, MIT license) |
| Safari | Native HLS — `<video src="...m3u8">`, no hls.js needed |
| Chrome/Firefox/Edge | hls.js loaded dynamically, attached to `<video>` |
| Detection | URL contains `.m3u8` or MIME `application/x-mpegURL` |
| Dependency | Optional peer dependency: `hls.js` |
| Element | Same `<video>` element as HTML5Adapter |
| Events | Native `<video>` events (same as HTML5Adapter) |
| Quality levels | Available via `hls.levels` API |
| Error recovery | hls.js auto-recovery for media/network errors |

**HLS URL patterns:**
- `https://cdn.filerobot.com/video/output.m3u8`
- `https://example.com/stream/playlist.m3u8`
- Any URL ending in `.m3u8`

**HLS configuration (optional):**
```typescript
interface HLSConfig {
  /** Enable web worker for demuxing (default: true) */
  enableWorker?: boolean;
  /** Initial quality level: -1 = auto (default: -1) */
  startLevel?: number;
  /** Cap quality to player dimensions (default: true) */
  capLevelToPlayerSize?: boolean;
  /** Custom hls.js config overrides */
  hlsConfig?: Partial<HlsConfig>;
}
```

**Initialization flow:**
```
1. Check if browser supports HLS natively (Safari, iOS)
   → Yes: use <video src="...m3u8"> directly (HTML5Adapter behavior)
   → No: continue to step 2

2. Check if hls.js is available (global Hls or imported)
   → Yes: create Hls instance, attach to <video>
   → No: check if passed via config.hlsConstructor
     → Yes: use provided constructor
     → No: throw error with helpful message

3. hls.js event mapping:
   Hls.Events.MANIFEST_PARSED → 'loadedmetadata'
   Hls.Events.ERROR → error recovery or 'error' event
   Hls.Events.LEVEL_SWITCHED → quality change (informational)
```

**Reference implementation (portals-fe/jolipage-next-js):**
The Scaleflex portals-fe project uses video.js + @videojs/http-streaming for HLS, but that stack is ~300KB+. Our approach uses hls.js directly (~70KB) for a much lighter solution while maintaining the same adaptive streaming capabilities.

---

### YouTube Adapter Details

| Aspect | Implementation |
|--------|---------------|
| API | YouTube IFrame Player API (loaded dynamically) |
| Script loading | Inject `https://www.youtube.com/iframe_api` on first use, cached |
| Element | `<div>` replaced by iframe via `YT.Player` |
| Events | Map YT.PlayerState to adapter events |
| Time updates | `setInterval` at 250ms (YT API has no native `timeupdate`) |
| Fullscreen | Native iframe fullscreen via Fullscreen API on container |
| Overlay | Transparent `<div>` positioned over iframe for hotspot markers |
| Controls | Our custom controls replace YT controls (`controls: 0`) |
| Poster | Use YT thumbnail if no poster provided |
| CORS | No CORS issues (iframe-based) |

**YouTube URL patterns:**
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://youtube.com/shorts/VIDEO_ID`

### Vimeo Adapter Details

| Aspect | Implementation |
|--------|---------------|
| SDK | `@vimeo/player` (loaded dynamically or bundled as optional) |
| Element | `<div>` with Vimeo Player iframe |
| Events | Native Vimeo events map 1:1 to adapter events |
| Time updates | Vimeo's native `timeupdate` event |
| Fullscreen | Via Fullscreen API on container |
| Overlay | Same as YouTube — transparent div over iframe |
| Controls | Disable Vimeo controls, use ours |

**Vimeo URL patterns:**
- `https://vimeo.com/VIDEO_ID`
- `https://player.vimeo.com/video/VIDEO_ID`

### Config Changes

```typescript
interface CIVideoHotspotConfig {
  // Existing
  src: string;  // Now accepts YouTube/Vimeo/HLS URLs

  // New (optional)
  playerType?: 'auto' | 'html5' | 'hls' | 'youtube' | 'vimeo';  // default: 'auto'

  /** HLS-specific configuration (only used when playing .m3u8 streams) */
  hls?: HLSConfig;
}
```

### Migration Impact

- **Breaking changes:** None. Existing HTML5 usage works identically.
- **New optional peer dependencies:**
  - `hls.js` — only needed for HLS on non-Safari browsers
  - `@vimeo/player` — only needed for Vimeo
- **Bundle size impact:** HLS adapter adds ~2KB (without hls.js), YouTube ~3KB, Vimeo ~2KB (without SDK).

### Known Limitations

| Limitation | Details |
|------------|---------|
| YouTube controls | Must hide YT controls (`controls: 0`), requires `origin` param |
| YouTube mobile | iOS auto-fullscreen behavior may affect overlay |
| Vimeo DRM | Some Vimeo videos have playback restrictions |
| Seek accuracy | YouTube seek is keyframe-based (may have ~0.5s drift) |
| Volume on mobile | iOS/Android ignore programmatic volume changes |
| Autoplay | Browsers require muted for autoplay (applies to all adapters) |
| HLS without hls.js | Chrome/Firefox/Edge cannot play HLS natively; hls.js required |
| HLS live streams | Live HLS streams not actively supported (VOD focus) |

---

## 6. Phase 2: Enhanced Shoppable Features

### Goal

Upgrade the built-in product popover template to support richer e-commerce content: image galleries, product variants, ratings, wishlists, countdown timers, and add-to-cart callbacks.

### Extended PopoverData

```typescript
interface PopoverData {
  // === Existing fields (unchanged) ===
  title?: string;
  price?: string;
  originalPrice?: string;
  description?: string;
  image?: string;
  url?: string;
  ctaText?: string;          // default: 'View details'
  badge?: string;            // 'NEW', 'SALE', '-30%'

  // === New fields (Phase 2) ===

  /** Multiple product images for gallery swipe */
  images?: string[];

  /** Star rating (1-5, supports half stars like 4.5) */
  rating?: number;

  /** Number of customer reviews */
  reviewCount?: number;

  /** Product variants (size, color, etc.) */
  variants?: ProductVariant[];

  /** Show wishlist/favorite heart button */
  wishlist?: boolean;

  /** Wishlist initial state */
  wishlisted?: boolean;

  /** Countdown timer target (ISO date string or Date object) */
  countdown?: string | Date;

  /** Countdown label text */
  countdownLabel?: string;   // default: 'Sale ends in'

  /** Secondary CTA button */
  secondaryCta?: {
    text: string;
    url?: string;
    onClick?: (hotspot: VideoHotspotItem) => void;
  };

  /** Additional product attributes */
  customFields?: Array<{
    label: string;
    value: string;
  }>;

  /** SKU / product identifier for cart integration */
  sku?: string;

  /** Currency code for formatting */
  currency?: string;         // e.g. 'USD', 'EUR'

  // === Callbacks ===

  /** Called when "Add to Cart" is clicked */
  onAddToCart?: (data: AddToCartEvent) => void;

  /** Called when wishlist button is toggled */
  onWishlistToggle?: (wishlisted: boolean, hotspot: VideoHotspotItem) => void;

  /** Called when a variant is selected */
  onVariantSelect?: (variant: ProductVariant, hotspot: VideoHotspotItem) => void;

  /** Extensible — any additional fields */
  [key: string]: unknown;
}

interface ProductVariant {
  /** Variant identifier */
  id: string;

  /** Variant type (e.g. 'size', 'color', 'material') */
  type: string;

  /** Display label (e.g. 'Medium', 'Red', 'Cotton') */
  label: string;

  /** Color hex value (only for type: 'color') */
  color?: string;

  /** Optional image URL for this variant */
  image?: string;

  /** Price override for this variant */
  price?: string;

  /** Whether this variant is available */
  available?: boolean;        // default: true

  /** Whether this variant is selected by default */
  selected?: boolean;
}

interface AddToCartEvent {
  hotspot: VideoHotspotItem;
  sku?: string;
  selectedVariants: ProductVariant[];
  quantity: number;
}
```

### Product Card Template (Enhanced)

```
┌──────────────────────────────┐
│  [Image Gallery]  ← / →     │  ← Swipeable, dot indicators
│  [1/4 dots]                  │
├──────────────────────────────┤
│  ❤ Wishlist          SALE    │  ← Heart icon + Badge
│                              │
│  Product Title               │
│  ★★★★☆ (42 reviews)         │  ← Star rating
│                              │
│  ~~$120~~  $89               │  ← Price with strikethrough
│                              │
│  Size:  [S] [M] [L] [XL]    │  ← Variant selector (pills)
│  Color: ● ● ●               │  ← Color swatches
│                              │
│  Short product description   │
│  text goes here...           │
│                              │
│  ⏱ Sale ends in 2d 14h 32m  │  ← Countdown timer
│                              │
│  Material: Cotton            │  ← Custom fields
│  Weight: 250g                │
│                              │
│  [Add to Cart]  [Details →]  │  ← Primary + secondary CTA
└──────────────────────────────┘
```

### New CSS Custom Properties (Phase 2)

```css
/* Image gallery */
--ci-video-hotspot-gallery-height: 200px;
--ci-video-hotspot-gallery-dot-size: 6px;
--ci-video-hotspot-gallery-dot-color: rgba(255, 255, 255, 0.5);
--ci-video-hotspot-gallery-dot-active: #ffffff;
--ci-video-hotspot-gallery-arrow-bg: rgba(0, 0, 0, 0.3);

/* Rating */
--ci-video-hotspot-rating-color: #f5a623;
--ci-video-hotspot-rating-empty-color: #ddd;
--ci-video-hotspot-rating-size: 14px;
--ci-video-hotspot-review-color: #888;

/* Variants */
--ci-video-hotspot-variant-border: 1px solid #ddd;
--ci-video-hotspot-variant-active-border: 2px solid #0058a3;
--ci-video-hotspot-variant-radius: 6px;
--ci-video-hotspot-variant-padding: 6px 12px;
--ci-video-hotspot-swatch-size: 24px;

/* Wishlist */
--ci-video-hotspot-wishlist-color: #999;
--ci-video-hotspot-wishlist-active: #ff4444;
--ci-video-hotspot-wishlist-size: 20px;

/* Countdown */
--ci-video-hotspot-countdown-bg: #fff3cd;
--ci-video-hotspot-countdown-color: #856404;
--ci-video-hotspot-countdown-font-size: 12px;

/* Secondary CTA */
--ci-video-hotspot-secondary-cta-color: #0058a3;
--ci-video-hotspot-secondary-cta-bg: transparent;
```

### Image Gallery Behavior

- Swipe left/right on touch devices
- Click arrows on desktop
- Dot indicators showing current slide
- Lazy loading for off-screen images
- Smooth CSS transition between slides
- Gallery height configurable via CSS var
- Falls back to single `image` if `images` not provided

### Variant Selector Behavior

- Group variants by `type` (size, color, material, etc.)
- `type: 'color'` renders as circular swatches with the `color` hex value
- Other types render as pill-shaped buttons
- Unavailable variants shown with strikethrough/disabled state
- Selecting a variant updates the displayed price (if variant has `price`)
- Selecting a variant updates the gallery (if variant has `image`)
- `onVariantSelect` callback fires on change

### Countdown Timer Behavior

- Parse `countdown` value (ISO string or Date)
- Display as "Xd Xh Xm Xs" format
- Update every second via `setInterval`
- When timer reaches 0: show "Ended" and disable CTA
- Auto-cleanup of interval on popover close/destroy
- Hidden if `countdown` not provided or already expired

### Files to Modify

| File | Changes |
|------|---------|
| `src/core/types.ts` | Add new `PopoverData` fields, `ProductVariant`, `AddToCartEvent` |
| `src/popover/template.ts` | Rewrite to support gallery, variants, rating, countdown, etc. |
| `src/styles/index.css` | Add ~150 lines for new components |
| `tests/` | New tests for template rendering |

---

## 7. Phase 3: Standalone Visual Editor

### Goal

Create a standalone web application that allows non-technical users to visually create and edit video hotspot configurations. The editor outputs a JSON config that can be used directly with the `CIVideoHotspot` plugin.

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | React 18+ |
| Language | TypeScript 5.5+ |
| Build | Vite 5.4+ |
| State | React Context + useReducer (no external state library) |
| Drag & Drop | Native HTML5 Drag API + pointer events |
| Styling | CSS Modules + CSS variables (consistent with plugin) |
| Undo/Redo | Command pattern with history stack |
| Persistence | LocalStorage + JSON file export |

### Package Structure

```
packages/
├── core/                          # Existing plugin (renamed from root)
│   ├── src/
│   ├── package.json               # js-cloudimage-video-hotspot
│   └── ...
└── editor/                        # New: standalone editor app
    ├── src/
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── components/
    │   │   ├── Toolbar/
    │   │   │   ├── Toolbar.tsx
    │   │   │   ├── FileMenu.tsx
    │   │   │   ├── ExportDialog.tsx
    │   │   │   └── SettingsDialog.tsx
    │   │   ├── VideoCanvas/
    │   │   │   ├── VideoCanvas.tsx      # Video player + overlay
    │   │   │   ├── DraggableMarker.tsx  # Draggable hotspot marker
    │   │   │   └── CanvasOverlay.tsx    # Click-to-create overlay
    │   │   ├── HotspotList/
    │   │   │   ├── HotspotList.tsx      # Left panel: list of hotspots
    │   │   │   ├── HotspotListItem.tsx  # Individual hotspot row
    │   │   │   └── AddHotspotButton.tsx
    │   │   ├── PropertiesPanel/
    │   │   │   ├── PropertiesPanel.tsx  # Right panel: selected hotspot props
    │   │   │   ├── PositionSection.tsx  # x, y, width inputs
    │   │   │   ├── TimingSection.tsx    # startTime, endTime inputs
    │   │   │   ├── ContentSection.tsx   # title, price, image, etc.
    │   │   │   ├── StyleSection.tsx     # markerStyle, animation, etc.
    │   │   │   └── BehaviorSection.tsx  # trigger, placement, pauseOnInteract
    │   │   ├── Timeline/
    │   │   │   ├── Timeline.tsx         # Bottom panel: timeline scrubber
    │   │   │   ├── TimelineTrack.tsx    # Single hotspot's time range
    │   │   │   ├── TimelineRuler.tsx    # Time ruler with ticks
    │   │   │   └── KeyframeEditor.tsx   # Keyframe dots on timeline
    │   │   ├── Preview/
    │   │   │   └── PreviewMode.tsx      # Full preview using actual plugin
    │   │   └── common/
    │   │       ├── ColorPicker.tsx
    │   │       ├── NumberInput.tsx
    │   │       ├── TimeInput.tsx        # mm:ss input
    │   │       └── IconButton.tsx
    │   ├── state/
    │   │   ├── EditorContext.tsx        # React Context provider
    │   │   ├── editorReducer.ts         # useReducer actions & state
    │   │   ├── actions.ts              # Action creators
    │   │   ├── selectors.ts            # Derived state selectors
    │   │   └── history.ts              # Undo/redo command stack
    │   ├── hooks/
    │   │   ├── useVideoPlayer.ts       # Video playback control
    │   │   ├── useDragMarker.ts        # Drag & drop marker logic
    │   │   ├── useTimeline.ts          # Timeline interaction
    │   │   ├── useKeyboardShortcuts.ts # Editor keyboard shortcuts
    │   │   └── useExport.ts            # JSON export logic
    │   ├── utils/
    │   │   ├── export.ts               # Generate JSON config
    │   │   ├── import.ts               # Parse JSON config
    │   │   ├── validation.ts           # Validate config structure
    │   │   └── templates.ts            # Hotspot preset templates
    │   └── styles/
    │       ├── editor.css              # Editor layout styles
    │       ├── variables.css           # Editor CSS variables
    │       └── components/             # Per-component styles
    ├── public/
    │   └── index.html
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

### Editor Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  [File ▾] [Edit ▾] [Templates ▾]   │   [Preview] [Export JSON]  │
├──────────────┬───────────────────────────────┬───────────────────┤
│              │                               │                   │
│  HOTSPOTS    │      VIDEO CANVAS             │  PROPERTIES       │
│              │                               │                   │
│  + Add New   │  ┌───────────────────────┐    │  Position         │
│              │  │                       │    │  ├─ X: [65] %     │
│  ● Bag       │  │    🎬 Video Player    │    │  └─ Y: [40] %     │
│    12s-25s   │  │                       │    │                   │
│              │  │      [●] ← hotspot    │    │  Timing           │
│  ● Shoes     │  │                       │    │  ├─ Start: [0:12] │
│    30s-45s   │  │                       │    │  └─ End:   [0:25] │
│              │  └───────────────────────┘    │                   │
│  ● Watch     │                               │  Content          │
│    50s-60s   │  Video URL:                   │  ├─ Title: [...]  │
│              │  [https://youtube.com/...]     │  ├─ Price: [...]  │
│              │                               │  ├─ Image: [...]  │
│              │                               │  └─ CTA:   [...]  │
│              │                               │                   │
│              │                               │  Style            │
│              │                               │  ├─ Marker: [dot▾]│
│              │                               │  ├─ Anim:  [fade▾]│
│              │                               │  └─ Pulse: [✓]    │
│              │                               │                   │
├──────────────┴───────────────────────────────┴───────────────────┤
│  ◀ ▶ 0:15 / 1:30                                                │
│  ├──────────────────────────────────────────────────────────────┤│
│  │ ■■■■■■■■■■                    (Bag)                          ││
│  │                          ■■■■■■■■■ (Shoes)                  ││
│  │                                       ■■■■■ (Watch)         ││
│  ├──────────────────────────────────────────────────────────────┤│
│  0:00    0:15    0:30    0:45    1:00    1:15    1:30            │
└──────────────────────────────────────────────────────────────────┘
```

### Editor State

```typescript
interface EditorState {
  // Video
  videoUrl: string;
  videoDuration: number;
  currentTime: number;
  isPlaying: boolean;

  // Config
  config: Partial<CIVideoHotspotConfig>;

  // Hotspots
  hotspots: VideoHotspotItem[];
  selectedHotspotId: string | null;

  // Chapters
  chapters: VideoChapter[];

  // Editor UI
  mode: 'edit' | 'preview';
  zoom: number;                 // timeline zoom level
  snapToGrid: boolean;
  showGrid: boolean;

  // History
  undoStack: EditorAction[];
  redoStack: EditorAction[];
}

type EditorAction =
  | { type: 'ADD_HOTSPOT'; hotspot: VideoHotspotItem }
  | { type: 'REMOVE_HOTSPOT'; id: string }
  | { type: 'UPDATE_HOTSPOT'; id: string; updates: Partial<VideoHotspotItem> }
  | { type: 'SELECT_HOTSPOT'; id: string | null }
  | { type: 'MOVE_HOTSPOT'; id: string; x: number; y: number }
  | { type: 'RESIZE_TIME'; id: string; startTime: number; endTime: number }
  | { type: 'ADD_KEYFRAME'; hotspotId: string; keyframe: Keyframe }
  | { type: 'REMOVE_KEYFRAME'; hotspotId: string; index: number }
  | { type: 'ADD_CHAPTER'; chapter: VideoChapter }
  | { type: 'REMOVE_CHAPTER'; id: string }
  | { type: 'SET_CONFIG'; updates: Partial<CIVideoHotspotConfig> }
  | { type: 'SET_VIDEO_URL'; url: string }
  | { type: 'IMPORT_CONFIG'; config: CIVideoHotspotConfig }
  | { type: 'UNDO' }
  | { type: 'REDO' };
```

### Editor Features

#### 1. Video Canvas (center panel)
- Renders the actual video (HTML5, YouTube, or Vimeo)
- Transparent overlay for hotspot placement
- Click on video → create new hotspot at that position
- Drag existing markers to reposition
- Snap to grid (optional, configurable grid size)
- Current time position indicator
- Resize handles on markers (future)

#### 2. Hotspot List (left panel)
- Sorted by `startTime`
- Shows: marker icon, label, time range
- Click to select (highlights in canvas + properties)
- Drag to reorder (future)
- Right-click context menu: duplicate, delete
- "+ Add New" button at top
- Search/filter (future)

#### 3. Properties Panel (right panel)
- Only visible when a hotspot is selected
- Sections (collapsible):
  - **Position:** X, Y (number inputs with % suffix)
  - **Timing:** startTime, endTime (time inputs as mm:ss)
  - **Content:** title, price, originalPrice, description, image URL, CTA text, URL, badge
  - **Gallery:** multiple image URLs (add/remove)
  - **Variants:** variant editor (type, label, color, price)
  - **Style:** markerStyle dropdown, animation dropdown, pulse checkbox, icon input
  - **Behavior:** trigger mode, placement, pauseOnShow, pauseOnInteract, keepOpen

#### 4. Timeline (bottom panel)
- Horizontal time ruler (0:00 to duration)
- One track per hotspot (colored bars)
- Drag bar edges to adjust startTime/endTime
- Drag entire bar to shift in time
- Keyframe dots on track (for motion paths)
- Click keyframe to select/edit in properties
- Zoom in/out on timeline
- Playhead indicator (vertical line at current time)
- Click on ruler to seek video
- Snap to seconds or frames

#### 5. Toolbar (top bar)
- **File menu:** New, Open JSON, Save to LocalStorage, Export JSON, Export as HTML
- **Edit menu:** Undo, Redo, Select All, Delete Selected
- **Templates menu:** Product Showcase, Tutorial, Tour, Custom
- **Preview toggle:** Switch between edit and preview mode
- **Export JSON button:** Quick export

#### 6. Preview Mode
- Hides all editor panels
- Renders the actual `CIVideoHotspot` plugin with current config
- Full interactivity (click hotspots, see popovers, etc.)
- "Back to Editor" button in corner

#### 7. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |
| `Delete` / `Backspace` | Delete selected hotspot |
| `Ctrl+D` | Duplicate selected hotspot |
| `Ctrl+S` | Save to LocalStorage |
| `Ctrl+E` | Export JSON |
| `Space` | Play/pause video |
| `←` / `→` | Seek ±1s |
| `Shift+←` / `Shift+→` | Seek ±5s |
| `Ctrl+Click` on video | Create hotspot at click position |
| `Escape` | Deselect / exit preview |
| `P` | Toggle preview mode |

### Export Format

The editor outputs a standard `CIVideoHotspotConfig` JSON:

```json
{
  "src": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "poster": "https://example.com/poster.jpg",
  "theme": "light",
  "trigger": "click",
  "placement": "top",
  "pauseOnInteract": true,
  "pulse": true,
  "hotspotAnimation": "fade",
  "timelineIndicators": "dot",
  "controls": true,
  "fullscreenButton": true,
  "hotspotNavigation": true,
  "hotspots": [
    {
      "id": "hotspot-1",
      "x": "65%",
      "y": "40%",
      "startTime": 12,
      "endTime": 25,
      "label": "Designer Bag",
      "markerStyle": "dot",
      "animation": "fade",
      "data": {
        "title": "Designer Bag",
        "price": "$899",
        "originalPrice": "$1200",
        "image": "https://example.com/bag.jpg",
        "url": "/products/bag",
        "ctaText": "Shop Now",
        "badge": "SALE",
        "rating": 4.5,
        "reviewCount": 42
      },
      "keyframes": [
        { "time": 12, "x": 65, "y": 40 },
        { "time": 18, "x": 55, "y": 45 },
        { "time": 25, "x": 70, "y": 35 }
      ],
      "easing": "ease-in-out"
    }
  ],
  "chapters": [
    { "id": "intro", "title": "Introduction", "startTime": 0 },
    { "id": "products", "title": "Products", "startTime": 10 },
    { "id": "outro", "title": "Outro", "startTime": 50 }
  ]
}
```

### Preset Templates

| Template | Description | Pre-configured |
|----------|-------------|----------------|
| **Product Showcase** | Shoppable video with product cards | 3 sample hotspots with `data` (title, price, image, CTA) |
| **Tutorial / How-to** | Educational with info hotspots | Hotspots with `content` (HTML descriptions), chapters |
| **Virtual Tour** | Location/space walkthrough | Hotspots with `icon` markers, text content |
| **Custom** | Blank canvas | Empty config, user builds from scratch |

---

## 8. Phase 4: Future Features

### 8.1 Analytics (callback-based, no backend)

```typescript
interface AnalyticsEvent {
  type: 'hotspot_show' | 'hotspot_click' | 'popover_open' | 'popover_close' |
        'cta_click' | 'add_to_cart' | 'variant_select' | 'wishlist_toggle';
  hotspotId: string;
  timestamp: number;
  videoTime: number;
  data?: Record<string, unknown>;
}

interface CIVideoHotspotConfig {
  // New
  onAnalytics?: (event: AnalyticsEvent) => void;
}
```

### 8.2 Branching / Video Routing

```typescript
interface VideoHotspotItem {
  // New
  action?: HotspotAction;
}

type HotspotAction =
  | { type: 'seek'; time: number }           // Jump to time in current video
  | { type: 'video'; src: string }           // Switch to different video
  | { type: 'url'; href: string; target?: string }  // Navigate to URL
  | { type: 'custom'; handler: (hotspot: VideoHotspotItem) => void };
```

### 8.3 Quiz / Surveys

```typescript
interface QuizHotspot extends VideoHotspotItem {
  quiz: {
    question: string;
    type: 'multiple-choice' | 'text' | 'rating';
    options?: string[];
    correctAnswer?: string | number;
    onAnswer?: (answer: string | number, isCorrect: boolean) => void;
  };
}
```

### 8.4 Conditional Logic

```typescript
interface VideoHotspotItem {
  // New
  condition?: HotspotCondition;
}

interface HotspotCondition {
  /** Show only if these hotspots were clicked */
  requiredClicks?: string[];
  /** Show only if quiz answered correctly */
  requiredQuiz?: { hotspotId: string; correct: boolean };
  /** Custom condition function */
  custom?: (state: ViewerState) => boolean;
}
```

---

## 9. Architecture Overview

### Module Dependency Graph (v2.0.0)

```
index.ts
└── CIVideoHotspot
    ├── PlayerFactory
    │   ├── HTML5Adapter
    │   ├── HLSAdapter (extends HTML5 + hls.js)
    │   ├── YouTubeAdapter
    │   └── VimeoAdapter
    ├── TimelineEngine
    │   └── MotionEngine (keyframe interpolation)
    ├── Controls
    │   ├── ProgressBar
    │   │   ├── TimelineIndicators
    │   │   └── ChapterMarkers
    │   ├── PlayButton
    │   ├── VolumeSlider
    │   ├── SpeedSelector
    │   ├── TimeDisplay
    │   ├── FullscreenButton
    │   └── ChapterDropdown
    ├── Markers (Map)
    │   ├── createMarker (dot/dot-label/icon/numbered)
    │   └── updateMarkerPosition
    ├── Popovers (Map)
    │   ├── Popover
    │   ├── Position (flip/shift)
    │   ├── Template (product card, gallery, variants, rating...)
    │   └── Sanitize (XSS prevention)
    ├── HotspotNav
    ├── FullscreenControl
    ├── VideoKeyboardHandler
    ├── FocusTrap
    └── ARIA (live region, announcements)
```

### Event Flow

```
User clicks marker
  → stopPropagation()
  → onHotspotClick callback
  → hotspot.onClick callback
  → popover.show() / popover.hide()
  → setMarkerActive(true/false)
  → openPopovers.add/delete
  → handleHotspotInteract() → pause video (if pauseOnInteract)
  → createFocusTrap() → trap.activate()
  → onOpen/onClose callback

Video timeupdate (native event, ~4Hz)
  → onTimeUpdate(currentTime)
  → timeline.update(time) → { entered, exited, active }
  → showHotspot() for entered
  → hideHotspot() for exited
  → updateMarkerPosition() for active with keyframes
  → updateNavCounter()
  → updateCurrentChapter()
  → controls.update()

requestAnimationFrame loop (only during playback + active keyframes)
  → onTimeUpdate(currentTime) → high-fps position updates
```

---

## 10. API Reference (Complete)

### Constructor

```typescript
new CIVideoHotspot(
  element: HTMLElement | string,  // DOM element or CSS selector
  config: CIVideoHotspotConfig
): CIVideoHotspotInstance
```

### Static Methods

```typescript
// Auto-init from data attributes
CIVideoHotspot.autoInit(root?: HTMLElement): CIVideoHotspotInstance[]
```

### Instance Methods

#### Video Playback

| Method | Signature | Description |
|--------|-----------|-------------|
| `play` | `() => void` | Start playback |
| `pause` | `() => void` | Pause playback |
| `togglePlay` | `() => void` | Toggle play/pause |
| `seek` | `(time: number) => void` | Seek to time (seconds) |
| `getCurrentTime` | `() => number` | Get current time |
| `getDuration` | `() => number` | Get total duration |
| `setVolume` | `(level: number) => void` | Set volume (0-1) |
| `getVolume` | `() => number` | Get volume |
| `setMuted` | `(muted: boolean) => void` | Set mute state |
| `isMuted` | `() => boolean` | Check mute state |
| `setPlaybackRate` | `(rate: number) => void` | Set speed (0.5-2) |
| `getPlaybackRate` | `() => number` | Get speed |

#### Hotspot Management

| Method | Signature | Description |
|--------|-----------|-------------|
| `open` | `(id: string) => void` | Show popover for hotspot |
| `close` | `(id: string) => void` | Hide popover for hotspot |
| `closeAll` | `() => void` | Close all open popovers |
| `addHotspot` | `(hotspot: VideoHotspotItem) => void` | Add hotspot at runtime |
| `removeHotspot` | `(id: string) => void` | Remove hotspot by ID |
| `updateHotspot` | `(id: string, updates: Partial<VideoHotspotItem>) => void` | Update hotspot config |
| `getVisibleHotspots` | `() => string[]` | Get currently visible hotspot IDs |
| `getHotspots` | `() => VideoHotspotItem[]` | Get all hotspot definitions |

#### Navigation

| Method | Signature | Description |
|--------|-----------|-------------|
| `nextHotspot` | `() => void` | Seek to next hotspot |
| `prevHotspot` | `() => void` | Seek to previous hotspot |
| `goToHotspot` | `(id: string) => void` | Seek to specific hotspot |
| `goToChapter` | `(id: string) => void` | Seek to chapter start |
| `getCurrentChapter` | `() => string \| undefined` | Get active chapter ID |

#### Fullscreen

| Method | Signature | Description |
|--------|-----------|-------------|
| `enterFullscreen` | `() => void` | Enter fullscreen mode |
| `exitFullscreen` | `() => void` | Exit fullscreen mode |
| `isFullscreen` | `() => boolean` | Check fullscreen state |

#### Lifecycle

| Method | Signature | Description |
|--------|-----------|-------------|
| `update` | `(config: Partial<CIVideoHotspotConfig>) => void` | Reconfigure instance |
| `destroy` | `() => void` | Destroy instance and clean up |
| `getElements` | `() => { container, video, overlay, controls }` | Get DOM references |

### React API

```typescript
// Component
<CIVideoHotspotViewer
  ref={ref}            // CIVideoHotspotViewerRef
  src="..."
  hotspots={[...]}
  {...otherConfig}
/>

// Hook
const { containerRef, instance } = useCIVideoHotspot({
  src: '...',
  hotspots: [...],
  ...otherConfig,
});

// Ref methods (same as CIVideoHotspotInstance)
ref.current?.play();
ref.current?.goToHotspot('bag');
```

---

## 11. CSS Custom Properties

### Complete Variable Reference

#### Marker

| Variable | Default | Description |
|----------|---------|-------------|
| `--ci-video-hotspot-marker-size` | `28px` | Marker diameter |
| `--ci-video-hotspot-marker-color` | `#ffffff` | Marker text/icon color |
| `--ci-video-hotspot-marker-bg` | `rgba(0,0,0,0.6)` | Marker background |
| `--ci-video-hotspot-marker-border-width` | `2px` | Border width |
| `--ci-video-hotspot-marker-border-color` | `rgba(255,255,255,0.8)` | Border color |
| `--ci-video-hotspot-marker-border-radius` | `50%` | Border radius |
| `--ci-video-hotspot-marker-shadow` | `0 2px 8px rgba(0,0,0,0.3)` | Box shadow |

#### Pulse

| Variable | Default | Description |
|----------|---------|-------------|
| `--ci-video-hotspot-pulse-color` | `rgba(255,255,255,0.3)` | Pulse ring color |
| `--ci-video-hotspot-pulse-size` | `44px` | Pulse ring max size |
| `--ci-video-hotspot-pulse-duration` | `1.8s` | Pulse animation duration |

#### Popover

| Variable | Default | Description |
|----------|---------|-------------|
| `--ci-video-hotspot-popover-bg` | `#ffffff` | Background |
| `--ci-video-hotspot-popover-color` | `#1a1a1a` | Text color |
| `--ci-video-hotspot-popover-border` | `1px solid rgba(0,0,0,0.1)` | Border |
| `--ci-video-hotspot-popover-border-radius` | `12px` | Corner radius |
| `--ci-video-hotspot-popover-shadow` | `0 8px 32px rgba(0,0,0,0.12)` | Shadow |
| `--ci-video-hotspot-popover-padding` | `16px` | Content padding |
| `--ci-video-hotspot-popover-max-width` | `320px` | Max width |
| `--ci-video-hotspot-popover-max-height` | `400px` | Max height |
| `--ci-video-hotspot-popover-font-family` | system fonts | Font stack |
| `--ci-video-hotspot-popover-font-size` | `14px` | Base font size |
| `--ci-video-hotspot-popover-line-height` | `1.5` | Line height |
| `--ci-video-hotspot-popover-z-index` | `1000` | Z-index |

#### Arrow

| Variable | Default | Description |
|----------|---------|-------------|
| `--ci-video-hotspot-arrow-size` | `8px` | Arrow size |
| `--ci-video-hotspot-arrow-color` | (matches popover bg) | Arrow color |

#### Product Template

| Variable | Default | Description |
|----------|---------|-------------|
| `--ci-video-hotspot-title-font-size` | `16px` | Title size |
| `--ci-video-hotspot-title-font-weight` | `600` | Title weight |
| `--ci-video-hotspot-title-color` | `#1a1a1a` | Title color |
| `--ci-video-hotspot-price-color` | `#2d8c3c` | Price color |
| `--ci-video-hotspot-price-font-size` | `18px` | Price size |
| `--ci-video-hotspot-price-font-weight` | `700` | Price weight |
| `--ci-video-hotspot-description-color` | `#666666` | Description color |
| `--ci-video-hotspot-cta-bg` | `#0058a3` | CTA background |
| `--ci-video-hotspot-cta-color` | `#ffffff` | CTA text color |
| `--ci-video-hotspot-cta-border-radius` | `8px` | CTA radius |
| `--ci-video-hotspot-cta-padding` | `8px 16px` | CTA padding |
| `--ci-video-hotspot-original-price-color` | `#999999` | Strikethrough price |
| `--ci-video-hotspot-badge-bg` | `#ff4444` | Badge background |
| `--ci-video-hotspot-badge-color` | `#ffffff` | Badge text |

#### Controls

| Variable | Default | Description |
|----------|---------|-------------|
| `--ci-video-hotspot-controls-bg` | `rgba(0,0,0,0.75)` | Controls bar bg |
| `--ci-video-hotspot-controls-color` | `#ffffff` | Controls text |
| `--ci-video-hotspot-controls-height` | `48px` | Controls bar height |

#### Progress Bar

| Variable | Default | Description |
|----------|---------|-------------|
| `--ci-video-hotspot-progress-height` | `4px` | Track height |
| `--ci-video-hotspot-progress-bg` | `rgba(255,255,255,0.2)` | Track background |
| `--ci-video-hotspot-progress-fill` | `#ff4444` | Fill color |
| `--ci-video-hotspot-progress-buffered` | `rgba(255,255,255,0.3)` | Buffered color |
| `--ci-video-hotspot-progress-indicator-color` | `#ffcc00` | Indicator dot color |
| `--ci-video-hotspot-progress-indicator-size` | `8px` | Indicator dot size |
| `--ci-video-hotspot-progress-chapter-color` | `rgba(255,255,255,0.5)` | Chapter divider |

#### Hotspot Navigation

| Variable | Default | Description |
|----------|---------|-------------|
| `--ci-video-hotspot-nav-bg` | `rgba(0,0,0,0.7)` | Nav background |
| `--ci-video-hotspot-nav-color` | `#ffffff` | Nav text color |

#### Transitions

| Variable | Default | Description |
|----------|---------|-------------|
| `--ci-video-hotspot-hover-transition` | `200ms ease` | Hover effects |
| `--ci-video-hotspot-popover-transition` | `300ms ease` | Popover show/hide |
| `--ci-video-hotspot-hotspot-transition` | `300ms ease` | Hotspot enter/exit |
| `--ci-video-hotspot-controls-transition` | `300ms ease` | Controls show/hide |

#### Focus

| Variable | Default | Description |
|----------|---------|-------------|
| `--ci-video-hotspot-focus-ring` | `#4A90D9` | Focus outline color |

#### Dark Theme Overrides

Applied via `.ci-video-hotspot-theme-dark`:

| Variable | Dark Value |
|----------|------------|
| `--ci-video-hotspot-popover-bg` | `#1a1a1a` |
| `--ci-video-hotspot-popover-color` | `#f0f0f0` |
| `--ci-video-hotspot-popover-border` | `1px solid rgba(255,255,255,0.1)` |
| `--ci-video-hotspot-popover-shadow` | `0 8px 32px rgba(0,0,0,0.4)` |
| `--ci-video-hotspot-title-color` | `#f0f0f0` |
| `--ci-video-hotspot-description-color` | `#aaaaaa` |
| `--ci-video-hotspot-original-price-color` | `#777777` |

---

## 12. Accessibility

### WCAG 2.1 AA Compliance

| Criterion | Implementation |
|-----------|---------------|
| 1.1.1 Non-text Content | `aria-label` on all markers |
| 1.3.1 Info and Relationships | Semantic HTML, ARIA roles |
| 2.1.1 Keyboard | Full keyboard navigation for all controls |
| 2.1.2 No Keyboard Trap | Focus trap in popovers with Escape exit |
| 2.4.3 Focus Order | Logical tab order, managed focus |
| 2.4.7 Focus Visible | 3px solid focus ring on all interactive elements |
| 2.5.1 Pointer Gestures | All gestures have keyboard alternatives |
| 3.2.1 On Focus | No unexpected context changes on focus |
| 4.1.2 Name, Role, Value | ARIA attributes on all dynamic content |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` / `K` | Play / Pause |
| `Arrow Right` | Seek forward 5s |
| `Arrow Left` | Seek backward 5s |
| `Arrow Up` | Volume up 10% |
| `Arrow Down` | Volume down 10% |
| `M` | Toggle mute |
| `N` | Next hotspot |
| `P` | Previous hotspot |
| `F` | Toggle fullscreen |
| `Escape` | Close popovers / exit fullscreen |
| `Tab` / `Shift+Tab` | Navigate interactive elements |

### Screen Reader Support

- Live region announcements: "Hotspot appeared: [label]", "Chapter: [title]"
- Markers: `<button aria-label="[label]" aria-haspopup="dialog">`
- Popovers: `role="dialog"` (click mode) or `role="tooltip"` (hover mode)
- Focus trap in popovers with interactive content
- `aria-expanded`, `aria-hidden`, `aria-controls` attributes

### Motion Sensitivity

```css
@media (prefers-reduced-motion: reduce) {
  /* All animations disabled, transitions set to 0.01ms */
}
```

---

## 13. Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 80+ |
| Firefox | 80+ |
| Safari | 14+ |
| Edge | 80+ |
| iOS Safari | 14+ |
| Android Chrome | 80+ |

### Video Format Support

| Format | Chrome | Firefox | Safari | Edge |
|--------|--------|---------|--------|------|
| H.264 (MP4) | Yes | Yes | Yes | Yes |
| VP9 (WebM) | Yes | Yes | No | Yes |
| AV1 | Yes | Yes | No | Yes |
| HLS (.m3u8) | Yes* | Yes* | Yes (native) | Yes* |

*HLS on Chrome/Firefox/Edge requires `hls.js` (optional peer dependency). Safari/iOS support HLS natively.

---

## 14. Build & Distribution

### NPM Package

```json
{
  "name": "js-cloudimage-video-hotspot",
  "version": "2.0.0",
  "main": "dist/js-cloudimage-video-hotspot.cjs.js",
  "module": "dist/js-cloudimage-video-hotspot.esm.js",
  "unpkg": "dist/js-cloudimage-video-hotspot.min.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/js-cloudimage-video-hotspot.esm.js",
      "require": "./dist/js-cloudimage-video-hotspot.cjs.js"
    },
    "./react": {
      "types": "./dist/react/index.d.ts",
      "import": "./dist/react/index.js",
      "require": "./dist/react/index.cjs"
    }
  },
  "sideEffects": false,
  "files": ["dist"]
}
```

### Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with demo |
| `npm run build` | Build all outputs (ESM + CJS + UMD + React + types) |
| `npm run build:bundle` | Build main library only |
| `npm run build:react` | Build React wrapper only |
| `npm run typecheck` | TypeScript type checking |
| `npm run test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | ESLint check |

### Bundle Size Targets

| Output | Target (gzipped) |
|--------|-------------------|
| Core (v1.0.0) | < 20 KB |
| Core + YouTube/Vimeo adapters (v2.0.0) | < 25 KB |
| Core + Enhanced shoppable (v2.0.0) | < 28 KB |
| React wrapper | < 2 KB |
| Editor app (separate) | < 200 KB |

### Output Formats

| Format | File | Usage |
|--------|------|-------|
| ESM | `js-cloudimage-video-hotspot.esm.js` | Modern bundlers (webpack, vite, rollup) |
| CJS | `js-cloudimage-video-hotspot.cjs.js` | Node.js / legacy bundlers |
| UMD | `js-cloudimage-video-hotspot.min.js` | CDN / `<script>` tag |
| Types | `dist/index.d.ts` | TypeScript definitions |
