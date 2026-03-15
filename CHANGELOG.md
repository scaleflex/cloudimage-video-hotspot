# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-03-15

### Added

- Visual editor for interactive hotspot authoring
- GitHub Pages demo deployment
- CodeSandbox examples for vanilla JS and React

### Changed

- Improved editor sidebar UI with two-line point rows and General Settings title
- Lightweight `update()` path for reactive config changes

### Fixed

- Lint errors across adapter and fullscreen modules
- Removed stale editor build entry point

## [1.0.0] - 2025-02-24

### Added

- Initial release
- Time-based video hotspots with `startTime`/`endTime`
- Keyframe motion paths with easing functions (linear, ease-in, ease-out, ease-in-out)
- Timeline indicators (dot/range) on progress bar
- Pause-on-interact: auto-pause on hotspot click, resume when all popovers close
- Chapter system with navigation dropdown and progress bar dividers
- Hotspot navigation (prev/next with counter)
- Built-in video controls: play/pause, volume, speed (0.5x-2x), time, fullscreen
- Popover system with flip/shift positioning and built-in product card template
- HTML sanitization for user content
- Light and dark themes with 40+ CSS variables
- WCAG 2.1 AA accessibility: keyboard navigation, ARIA, focus traps, screen reader
- Data-attributes auto-initialization
- React wrapper: component, hook, and ref API
- TypeScript type definitions
- ESM, CJS, and UMD builds
- Optional Cloudimage CDN integration for poster images
