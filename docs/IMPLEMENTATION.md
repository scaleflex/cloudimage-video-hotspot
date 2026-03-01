# Implementation Plan

> Based on [specs.md](../specs.md) | Updated: 2026-03-01

Legend: `[x]` done | `[-]` partial | `[ ]` not started

---

## Core Plugin (v1.0.0) — All Done

### Hotspot System
- [x] Time-based hotspots (`startTime`/`endTime`)
- [x] Keyframe motion (interpolated at 60fps, 4 easing functions)
- [x] Timeline engine (O(log n) binary search for visibility)
- [x] Hotspot navigation (prev/next buttons, counter)
- [x] Runtime API (`addHotspot`, `removeHotspot`, `updateHotspot`)

### Markers
- [x] Marker styles: `dot`, `dot-label`, `icon`, `numbered`
- [x] Custom icon support (SVG string, image URL, CSS class)
- [x] Pulse animation (ring + breathe)
- [x] Entrance/exit animations (`fade`, `scale`, `none`)
- [x] SVG sanitization (XSS prevention)

### Popover System
- [x] Click and hover trigger modes
- [x] Auto-positioning with flip/shift (viewport-aware)
- [x] Arrow placement (top, bottom, left, right, auto)
- [x] HTML content sanitization
- [x] Custom render function (`renderPopover`)
- [x] Custom marker render (`renderMarker`)

### Product Template (basic)
- [x] Image (16:9 aspect ratio)
- [x] Title
- [x] Price + original price (strikethrough)
- [x] Badge (e.g. "SALE", "-30%")
- [x] Description
- [x] CTA button (link with `target="_blank"`)

### Video Player
- [x] Native HTML5 `<video>` wrapper
- [x] Multiple sources (format fallback via `<source>`)
- [x] Poster image
- [x] Autoplay (with auto-mute)
- [x] Loop
- [x] Pause-on-interact (auto-pause on hotspot click/hover)

### Controls
- [x] Play/pause button
- [x] Volume button + slider
- [x] Speed selector (0.5x - 2x)
- [x] Time display (current / duration)
- [x] Fullscreen button
- [x] Progress bar with seek (mouse + touch drag)
- [x] Buffered indicator
- [x] Progress tooltip (hover time)
- [x] Auto-hide during playback, show on pause/mouse move
- [x] Timeline indicators (dot/range for hotspots)

### Chapters
- [x] Chapter definitions (`id`, `title`, `startTime`, `endTime`)
- [x] Auto-calculated `endTime` from next chapter
- [x] Chapter dropdown in controls
- [x] Chapter dividers on progress bar
- [x] `goToChapter()` navigation
- [x] `onChapterChange` callback
- [x] Screen reader announcements

### Accessibility (WCAG 2.1 AA)
- [x] Keyboard navigation (Space/K, arrows, N/P, F, M, Escape, Tab)
- [x] ARIA attributes (`aria-label`, `aria-expanded`, `aria-haspopup`, `aria-controls`)
- [x] Live region announcements (hotspot appear, chapter change)
- [x] Focus trap in popovers
- [x] Focus ring on all interactive elements
- [x] `prefers-reduced-motion` support (animations disabled)
- [x] Semantic HTML (`<button>`, roles)

### Theming & Styling
- [x] Light theme (default)
- [x] Dark theme (CSS class override)
- [x] 79 CSS custom properties
- [x] Scoped box-sizing

### Integration
- [x] React component (`CIVideoHotspotViewer`)
- [x] React hook (`useCIVideoHotspot`)
- [x] React ref API (`useImperativeHandle`)
- [x] Auto-init from HTML data attributes (`data-ci-video-hotspot-*`)
- [x] Cloudimage CDN (poster/thumbnail optimization)

### Build & Distribution
- [x] ESM output
- [x] CJS output
- [x] UMD output (CDN)
- [x] TypeScript declarations
- [x] Source maps
- [x] React separate entry point
- [x] Vite build config

### Documentation
- [x] README.md (API reference, examples, theming)
- [x] Demo app (`demo/demo.ts` — 8 examples)
- [x] Vanilla JS example (`examples/vanilla/`)
- [x] React example (`examples/react/`)
- [x] specs.md (technical specification)
- [x] specs-ru.md (Russian version)
- [x] docs/IMPLEMENTATION.md (this file)

---

## Phase 1: Multi-Player Adapter (YouTube / Vimeo / HLS) — Complete

### 1.1 Player Adapter Interface
- [x] Create `src/player/adapter.ts` — `VideoPlayerAdapter` abstract class
- [x] Define `AdapterEvent` type (play, pause, timeupdate, durationchange, ended, loadedmetadata, waiting, playing, progress, error, volumechange, ratechange)
- [x] Define `AdapterOptions` type

### 1.2 HTML5 Adapter (refactor)
- [x] Create `src/player/adapters/html5-adapter.ts`
- [x] Extract current `video-player.ts` logic into adapter
- [x] Implement `VideoPlayerAdapter` interface
- [x] Update `video-player.ts` to use adapter internally
- [x] `play()` returns `Promise<void>`
- [x] Emit `volumechange` and `ratechange` events
- [x] All existing tests pass

### 1.3 HLS Adapter
- [x] Create `src/player/adapters/hls-adapter.ts`
- [x] Extend HTML5Adapter (same `<video>` element)
- [x] Detect native HLS support (Safari/iOS)
- [x] Dynamic hls.js loading for Chrome/Firefox/Edge
- [x] Map hls.js events to adapter events
- [x] Error recovery (media/network errors)
- [x] Add `hls.js` as optional peer dependency
- [x] Add `hls?: HLSConfig` to `CIVideoHotspotConfig`

### 1.4 YouTube Adapter
- [x] Create `src/player/adapters/youtube-adapter.ts`
- [x] Dynamic YouTube IFrame API script loading
- [x] URL parsing (watch, youtu.be, embed, shorts)
- [x] Map `YT.PlayerState` to adapter events
- [x] `setInterval` for timeupdate (250ms)
- [x] Transparent overlay div for hotspot markers
- [x] Hide YouTube controls (`controls: 0`)
- [x] Emit `volumechange` from `setVolume()`/`setMuted()`
- [x] Emit `ratechange` from `setPlaybackRate()`
- [x] `play()` returns `Promise<void>`

### 1.5 Vimeo Adapter
- [x] Create `src/player/adapters/vimeo-adapter.ts`
- [x] Dynamic `@vimeo/player` SDK loading
- [x] URL parsing (vimeo.com, player.vimeo.com)
- [x] Map Vimeo events to adapter events
- [x] Transparent overlay div for markers
- [x] Disable Vimeo controls
- [x] Add `@vimeo/player` as optional peer dependency
- [x] Emit `volumechange` from `setVolume()`/`setMuted()`
- [x] Emit `ratechange` from `setPlaybackRate()`
- [x] `play()` returns `Promise<void>`

### 1.6 Player Factory
- [x] Create `src/player/player-factory.ts`
- [x] URL detection: `.m3u8` → HLS, `youtube.com` → YT, `vimeo.com` → Vimeo, else → HTML5
- [x] Add `playerType` config option (`'auto' | 'html5' | 'hls' | 'youtube' | 'vimeo'`)
- [x] `extractYouTubeId()`, `extractVimeoId()`, `isHLS()` helpers

### 1.7 Integration
- [x] Update `CIVideoHotspot` constructor to use `PlayerFactory`
- [x] Update `video-player.ts` facade to use adapter
- [x] Update demo with YouTube/Vimeo/HLS examples
- [x] Update package.json: peer dependencies

### Tests
- [x] `tests/html5-adapter.test.ts` — adapter creation, events, volumechange, ratechange, play() promise
- [x] `tests/player-factory.test.ts` — URL detection for all patterns

---

## Phase 2: Enhanced Shoppable Features — Complete

### 2.1 Extended PopoverData types
- [x] Add to `src/core/types.ts`:
  - `images?: string[]`
  - `rating?: number`
  - `reviewCount?: number`
  - `variants?: ProductVariant[]`
  - `wishlist?: boolean`
  - `wishlisted?: boolean`
  - `countdown?: string | Date`
  - `countdownLabel?: string`
  - `currency?: string`
  - `secondaryCta?: { text, url?, onClick? }`
  - `customFields?: { label, value }[]`
  - `sku?: string`
  - `onAddToCart?: (data: AddToCartEvent) => void`
  - `onWishlistToggle?: (wishlisted, hotspot: VideoHotspotItem) => void`
  - `onVariantSelect?: (variant, allSelected, hotspot: VideoHotspotItem) => void`
- [x] Define `ProductVariant` interface (with `image?: string`)
- [x] Define `AddToCartEvent` interface (with `hotspot: VideoHotspotItem`, `quantity: number`)

### 2.2 Image Gallery
- [x] `src/popover/components/gallery.ts` — Swipeable gallery component
- [x] Touch swipe + click arrows
- [x] Dot indicators (current slide)
- [x] Lazy loading for off-screen images
- [x] CSS transitions between slides
- [x] Fallback to single `image` if `images` not provided
- [x] `setMainImage(src)` method for variant image switching

### 2.3 Product Variants
- [x] `src/popover/components/variants.ts` — Variant selector
- [x] Render variant groups by `type`
- [x] Color swatches for `type: 'color'`
- [x] Pill buttons for other types
- [x] Disabled/unavailable state
- [x] Price update on variant selection
- [x] Image update on variant selection via `galleryUpdateFn`
- [x] `onVariantSelect` callback (passes full `hotspot` object)

### 2.4 Star Rating
- [x] `src/popover/components/rating.ts`
- [x] SVG star rendering (filled, half, empty)
- [x] Display `reviewCount` next to stars
- [x] CSS variables for colors

### 2.5 Wishlist Button
- [x] `src/popover/components/wishlist.ts`
- [x] Heart icon (toggle filled/outline)
- [x] `onWishlistToggle` callback (passes full `hotspot` object)
- [x] CSS variables for colors

### 2.6 Countdown Timer
- [x] `src/popover/components/countdown.ts`
- [x] Parse ISO date string or Date object
- [x] Display "Xd Xh Xm Xs" format
- [x] Update every second (`setInterval`)
- [x] "Ended" state when timer expires
- [x] Disables CTA button on expiry
- [x] Cleanup interval on popover close/destroy

### 2.7 Multiple CTAs
- [x] Primary CTA (existing "Add to Cart" / "View details")
- [x] Secondary CTA with `onClick` callback support
- [x] `onAddToCart` callback for primary CTA (sends `hotspot`, `quantity`)

### 2.8 Custom Fields
- [x] `src/popover/components/custom-fields.ts`
- [x] Render label/value pairs below description
- [x] Simple key-value layout

### 2.9 Styling
- [x] New CSS variables for gallery, rating, variants, wishlist, countdown
- [x] Dark theme overrides for new components
- [x] Mobile-responsive popover width

### Tests
- [x] `tests/gallery.test.ts` — gallery creation, navigation, swipe, dots
- [x] `tests/variants.test.ts` — pill/swatch rendering, selection, callbacks, gallery integration
- [x] `tests/wishlist.test.ts` — toggle, callbacks with hotspot object
- [x] `tests/rating.test.ts` — star rendering, half stars, review count
- [x] `tests/countdown.test.ts` — countdown display, expiry, cleanup
- [x] `tests/template-enhanced.test.ts` — full template rendering, AddToCartEvent with hotspot/quantity, secondary CTA onClick

---

## Phase 3: Standalone Visual Editor — Complete

### 3.1 Project Setup
- [x] Create `packages/editor/` directory
- [x] `package.json` with React 18, TypeScript, Vite
- [x] Vite config
- [x] TypeScript config
- [x] Import core plugin as dependency

### 3.2 State Management
- [x] `EditorContext` (React Context provider)
- [x] `editorReducer` (useReducer)
- [x] Action types: ADD/REMOVE/UPDATE/SELECT/DUPLICATE hotspot, SET_VIDEO_URL, IMPORT, RESET, UNDO, REDO
- [x] Undo/redo history stack (command pattern)
- [x] LocalStorage persistence (debounced auto-save)

### 3.3 Video Canvas (center panel)
- [x] Video player with overlay
- [x] Double-click on video → create hotspot at position
- [x] Draggable markers (pointer events)
- [x] Snap to grid (0.5s snap on timeline)
- [x] Current time indicator

### 3.4 Hotspot List (left panel)
- [x] Sorted by startTime
- [x] Shows label, time range
- [x] Click to select
- [x] Add / delete buttons
- [x] Duplicate via Ctrl+D

### 3.5 Properties Panel (right panel)
- [x] Position section (X, Y inputs)
- [x] Timing section (startTime, endTime in seconds)
- [x] Content section (label, title, price, image, description, CTA, URL)
- [x] Style section (markerStyle, animation)
- [x] Behavior section (trigger, placement, pauseOnShow, pauseOnInteract, keepOpen)
- [x] Gallery section (multiple images with reorder)
- [x] Variants section (product variants: size/color/material/style)
- [x] Collapsible sections

### 3.6 Timeline (bottom panel)
- [x] Time ruler with ticks
- [x] Hotspot tracks (colored bars)
- [x] Drag bar edges for startTime/endTime (resize)
- [x] Drag bar middle to shift in time (move)
- [x] Keyframe dots on tracks
- [x] Draggable playhead indicator
- [x] Click on ruler to seek
- [x] Zoom in/out (1x, 2x, 4x)
- [x] Snap to 0.5s grid

### 3.7 Toolbar
- [x] New Project button (clear all)
- [x] Open JSON / Save JSON / Export HTML
- [x] Undo / Redo buttons
- [x] Templates menu (Product Showcase, Tutorial, Tour)
- [x] Preview toggle button

### 3.8 Preview Mode
- [x] Render actual CIVideoHotspot plugin
- [x] Full interactivity
- [x] "Back to Editor" button

### 3.9 Export/Import
- [x] JSON export (standard CIVideoHotspotConfig)
- [x] JSON import with validation
- [x] HTML export (standalone page with embedded config)

### 3.10 Keyboard Shortcuts
- [x] Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y — undo/redo
- [x] Delete — remove selected
- [x] Ctrl+D — duplicate selected hotspot
- [x] Ctrl+S — save (download JSON)
- [x] Ctrl+E — export JSON
- [x] Space — play/pause video
- [x] ←/→ — seek ±1s, Shift+←/→ — seek ±5s
- [x] P — preview mode toggle
- [x] Escape — deselect / exit preview

### Files
```
packages/editor/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── Toolbar/Toolbar.tsx
│   │   ├── VideoCanvas/{VideoCanvas,CanvasOverlay,DraggableMarker}.tsx
│   │   ├── HotspotList/{HotspotList,HotspotListItem}.tsx
│   │   ├── PropertiesPanel/{PropertiesPanel,PositionSection,TimingSection,ContentSection,StyleSection,BehaviorSection,GallerySection,VariantsSection}.tsx
│   │   ├── Timeline/{Timeline,TimelineRuler,TimelineTrack}.tsx
│   │   └── Preview/PreviewMode.tsx
│   ├── state/{actions,editorReducer,EditorContext,history}.ts
│   ├── hooks/{useKeyboardShortcuts,useVideoPlayer,useExport,useDragMarker}.ts
│   ├── utils/{export,import,templates}.ts
│   └── styles/{editor,variables}.css
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Phase 4: Future Features

### 4.1 Analytics
- [ ] `onAnalytics` callback in config
- [ ] Event types: hotspot_show, hotspot_click, popover_open, cta_click, etc.
- [ ] No backend — consumer handles data

### 4.2 Branching / Video Routing
- [ ] `action` field on VideoHotspotItem
- [ ] Action types: seek (time), video (new src), url (navigate), custom (handler)

### 4.3 Quiz / Surveys
- [ ] Quiz definition on hotspot
- [ ] Multiple choice, text input, rating
- [ ] Correct answer checking
- [ ] `onAnswer` callback

### 4.4 Conditional Logic
- [ ] `condition` field on VideoHotspotItem
- [ ] Required clicks, quiz results, custom function
- [ ] ViewerState tracking

### 4.5 AI Hotspot Suggestions
- [ ] Scene change detection
- [ ] Optimal hotspot placement recommendations

---

## Summary

| Phase | Status | Features | Done | Remaining |
|-------|--------|----------|------|-----------|
| Core (v1.0.0) | **Complete** | 22 features | 22 | 0 |
| Phase 1: Adapters | **Complete** | 7 modules | 7 | 0 |
| Phase 2: Shoppable | **Complete** | 9 features | 9 | 0 |
| Phase 3: Editor | **Complete** | 10 modules | 10 | 0 |
| Phase 4: Future | Not started | 5 features | 0 | 5 |
