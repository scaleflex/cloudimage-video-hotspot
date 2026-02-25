# Implementation Plan

> Based on [specs.md](../specs.md) | Updated: 2026-02-24

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
- [ ] Image gallery (multiple images, swipe) — **Phase 2**
- [ ] Product variants (size, color selectors) — **Phase 2**
- [ ] Star rating — **Phase 2**
- [ ] Wishlist button — **Phase 2**
- [ ] Countdown timer — **Phase 2**
- [ ] Multiple CTAs — **Phase 2**
- [ ] `onAddToCart` callback — **Phase 2**

### Video Player
- [x] Native HTML5 `<video>` wrapper
- [x] Multiple sources (format fallback via `<source>`)
- [x] Poster image
- [x] Autoplay (with auto-mute)
- [x] Loop
- [x] Pause-on-interact (auto-pause on hotspot click/hover)
- [ ] YouTube adapter — **Phase 1**
- [ ] Vimeo adapter — **Phase 1**
- [ ] HLS adapter (hls.js) — **Phase 1**
- [ ] Player adapter interface — **Phase 1**
- [ ] Player factory (auto-detect by URL) — **Phase 1**

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

### Tests
- [x] `tests/motion.test.ts` — keyframe interpolation, easing
- [x] `tests/timeline.test.ts` — visibility detection, navigation
- [x] `tests/config.test.ts` — config merging, validation, data attributes
- [x] `tests/coordinates.test.ts` — coordinate normalization
- [x] `tests/sanitize.test.ts` — HTML/SVG sanitization
- [x] `tests/time.test.ts` — time formatting
- [ ] Integration tests (full player flow)
- [ ] React component tests
- [ ] Accessibility tests
- [ ] Visual regression tests

### Documentation
- [x] README.md (API reference, examples, theming)
- [x] Demo app (`demo/demo.ts` — 3 examples)
- [x] Vanilla JS example (`examples/vanilla/`)
- [x] React example (`examples/react/`)
- [x] specs.md (technical specification)
- [x] specs-ru.md (Russian version)
- [x] docs/IMPLEMENTATION.md (this file)

---

## Phase 1: Multi-Player Adapter (YouTube / Vimeo / HLS)

> Priority: HLS first (primary Filerobot format), then YouTube, then Vimeo

### 1.1 Player Adapter Interface
- [ ] Create `src/player/adapter.ts` — `VideoPlayerAdapter` interface
- [ ] Define `VideoPlayerEvent` type
- [ ] Define `VideoPlayerAdapterConfig` type

### 1.2 HTML5 Adapter (refactor)
- [ ] Create `src/player/adapters/html5-adapter.ts`
- [ ] Extract current `video-player.ts` logic into adapter
- [ ] Implement `VideoPlayerAdapter` interface
- [ ] Update `video-player.ts` to use adapter internally
- [ ] Verify all existing tests pass

### 1.3 HLS Adapter
- [ ] Create `src/player/adapters/hls-adapter.ts`
- [ ] Extend HTML5Adapter (same `<video>` element)
- [ ] Detect native HLS support (Safari/iOS)
- [ ] Dynamic hls.js loading for Chrome/Firefox/Edge
- [ ] Map hls.js events to adapter events
- [ ] Error recovery (media/network errors)
- [ ] Add `hls.js` as optional peer dependency
- [ ] Add `hls?: HLSConfig` to `CIVideoHotspotConfig`
- [ ] Tests: HLS initialization, Safari fallback

### 1.4 YouTube Adapter
- [ ] Create `src/player/adapters/youtube-adapter.ts`
- [ ] Dynamic YouTube IFrame API script loading
- [ ] URL parsing (watch, youtu.be, embed, shorts)
- [ ] Map `YT.PlayerState` to adapter events
- [ ] `setInterval` for timeupdate (250ms)
- [ ] Transparent overlay div for hotspot markers
- [ ] Hide YouTube controls (`controls: 0`)
- [ ] Tests: URL parsing, event mapping

### 1.5 Vimeo Adapter
- [ ] Create `src/player/adapters/vimeo-adapter.ts`
- [ ] Dynamic `@vimeo/player` SDK loading
- [ ] URL parsing (vimeo.com, player.vimeo.com)
- [ ] Map Vimeo events to adapter events
- [ ] Transparent overlay div for markers
- [ ] Disable Vimeo controls
- [ ] Add `@vimeo/player` as optional peer dependency
- [ ] Tests: URL parsing, event mapping

### 1.6 Player Factory
- [ ] Create `src/player/player-factory.ts`
- [ ] URL detection: `.m3u8` → HLS, `youtube.com` → YT, `vimeo.com` → Vimeo, else → HTML5
- [ ] Add `playerType` config option (`'auto' | 'html5' | 'hls' | 'youtube' | 'vimeo'`)
- [ ] `extractYouTubeId()`, `extractVimeoId()`, `isHLS()` helpers
- [ ] Tests: URL detection for all patterns

### 1.7 Integration
- [ ] Update `CIVideoHotspot` constructor to use `PlayerFactory`
- [ ] Update `controls.ts` if needed (adapter abstraction)
- [ ] Update `getElements()` to return adapter element
- [ ] Update demo with YouTube/Vimeo/HLS examples
- [ ] Update README with new `src` URL examples
- [ ] Update package.json: peer dependencies

### Files to create
```
src/player/adapter.ts
src/player/player-factory.ts
src/player/adapters/html5-adapter.ts
src/player/adapters/hls-adapter.ts
src/player/adapters/youtube-adapter.ts
src/player/adapters/vimeo-adapter.ts
```

### Files to modify
```
src/player/video-player.ts      → refactor to use adapter
src/core/ci-video-hotspot.ts    → use PlayerFactory
src/core/types.ts               → add playerType, HLSConfig
src/core/config.ts              → validate new options
package.json                    → peer dependencies
```

---

## Phase 2: Enhanced Shoppable Features

### 2.1 Extended PopoverData types
- [ ] Add to `src/core/types.ts`:
  - `images?: string[]`
  - `rating?: number`
  - `reviewCount?: number`
  - `variants?: ProductVariant[]`
  - `wishlist?: boolean`
  - `wishlisted?: boolean`
  - `countdown?: string | Date`
  - `countdownLabel?: string`
  - `secondaryCta?: { text, url?, onClick? }`
  - `customFields?: { label, value }[]`
  - `sku?: string`
  - `onAddToCart?: (data: AddToCartEvent) => void`
  - `onWishlistToggle?: (wishlisted, hotspot) => void`
  - `onVariantSelect?: (variant, hotspot) => void`
- [ ] Define `ProductVariant` interface
- [ ] Define `AddToCartEvent` interface

### 2.2 Image Gallery
- [ ] Swipeable gallery component in `src/popover/template.ts`
- [ ] Touch swipe + click arrows
- [ ] Dot indicators (current slide)
- [ ] Lazy loading for off-screen images
- [ ] CSS transitions between slides
- [ ] Fallback to single `image` if `images` not provided

### 2.3 Product Variants
- [ ] Render variant groups by `type`
- [ ] Color swatches for `type: 'color'`
- [ ] Pill buttons for other types
- [ ] Disabled/unavailable state
- [ ] Price update on variant selection
- [ ] Image update on variant selection (if variant has `image`)
- [ ] `onVariantSelect` callback

### 2.4 Star Rating
- [ ] SVG star rendering (filled, half, empty)
- [ ] Display `reviewCount` next to stars
- [ ] CSS variables for colors

### 2.5 Wishlist Button
- [ ] Heart icon (toggle filled/outline)
- [ ] `onWishlistToggle` callback
- [ ] CSS variables for colors

### 2.6 Countdown Timer
- [ ] Parse ISO date string or Date object
- [ ] Display "Xd Xh Xm Xs" format
- [ ] Update every second (`setInterval`)
- [ ] "Ended" state when timer expires
- [ ] Cleanup interval on popover close/destroy

### 2.7 Multiple CTAs
- [ ] Primary CTA (existing "Add to Cart" / "View details")
- [ ] Secondary CTA (text link style)
- [ ] `onAddToCart` callback for primary CTA

### 2.8 Custom Fields
- [ ] Render label/value pairs below description
- [ ] Simple key-value layout

### 2.9 Styling
- [ ] New CSS variables for gallery, rating, variants, wishlist, countdown
- [ ] Dark theme overrides for new components
- [ ] Mobile-responsive popover width

### Files to modify
```
src/core/types.ts          → new interfaces
src/popover/template.ts    → rewrite with new components
src/styles/index.css       → ~150 new lines
```

---

## Phase 3: Standalone Visual Editor

### 3.1 Project Setup
- [ ] Create `packages/editor/` directory
- [ ] `package.json` with React 18, TypeScript, Vite
- [ ] Vite config
- [ ] TypeScript config
- [ ] Import core plugin as dependency

### 3.2 State Management
- [ ] `EditorContext` (React Context provider)
- [ ] `editorReducer` (useReducer)
- [ ] Action types: ADD/REMOVE/UPDATE/SELECT hotspot, SET_VIDEO_URL, IMPORT, UNDO, REDO
- [ ] Undo/redo history stack (command pattern)
- [ ] LocalStorage persistence

### 3.3 Video Canvas (center panel)
- [ ] Video player with overlay
- [ ] Click on video → create hotspot at position
- [ ] Draggable markers (pointer events)
- [ ] Snap to grid (optional)
- [ ] Current time indicator

### 3.4 Hotspot List (left panel)
- [ ] Sorted by startTime
- [ ] Shows marker icon, label, time range
- [ ] Click to select
- [ ] Add / delete buttons
- [ ] Context menu (duplicate, delete)

### 3.5 Properties Panel (right panel)
- [ ] Position section (X, Y inputs)
- [ ] Timing section (startTime, endTime as mm:ss)
- [ ] Content section (title, price, image, CTA, etc.)
- [ ] Style section (markerStyle, animation, pulse)
- [ ] Behavior section (trigger, placement, pauseOnInteract)

### 3.6 Timeline (bottom panel)
- [ ] Time ruler with ticks
- [ ] Hotspot tracks (colored bars)
- [ ] Drag bar edges for startTime/endTime
- [ ] Drag bar to shift in time
- [ ] Keyframe dots on tracks
- [ ] Playhead indicator
- [ ] Click on ruler to seek
- [ ] Zoom in/out

### 3.7 Toolbar
- [ ] File menu (New, Open JSON, Save, Export)
- [ ] Edit menu (Undo, Redo, Delete)
- [ ] Templates menu (Product Showcase, Tutorial, Tour, Custom)
- [ ] Preview toggle button
- [ ] Export JSON button

### 3.8 Preview Mode
- [ ] Render actual CIVideoHotspot plugin
- [ ] Full interactivity
- [ ] "Back to Editor" button

### 3.9 Export/Import
- [ ] JSON export (standard CIVideoHotspotConfig)
- [ ] JSON import with validation
- [ ] HTML export (standalone page with embedded config)

### 3.10 Keyboard Shortcuts
- [ ] Ctrl+Z / Ctrl+Shift+Z — undo/redo
- [ ] Delete — remove selected
- [ ] Ctrl+D — duplicate
- [ ] Ctrl+S — save
- [ ] Ctrl+E — export
- [ ] Space — play/pause
- [ ] P — preview mode
- [ ] Escape — deselect

### Files to create
```
packages/editor/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/         # All UI components
│   ├── state/              # Context, reducer, history
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Export, import, validation
│   └── styles/             # CSS
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
| Phase 1: Adapters | Not started | 7 modules | 0 | 7 |
| Phase 2: Shoppable | Not started | 9 features | 0 | 9 |
| Phase 3: Editor | Not started | 10 modules | 0 | 10 |
| Phase 4: Future | Not started | 5 features | 0 | 5 |
