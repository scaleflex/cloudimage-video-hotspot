import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HTML5Adapter } from '../src/player/adapters/html5-adapter';

describe('HTML5Adapter', () => {
  let adapter: HTML5Adapter;

  beforeEach(() => {
    adapter = new HTML5Adapter({
      src: 'test.mp4',
      poster: 'poster.jpg',
      muted: true,
    });
  });

  it('creates a video element', () => {
    const el = adapter.getElement();
    expect(el.tagName).toBe('VIDEO');
    expect(el.className).toBe('ci-video-hotspot-video');
  });

  it('applies poster attribute', () => {
    const video = adapter.getElement() as HTMLVideoElement;
    expect(video.poster).toContain('poster.jpg');
  });

  it('applies muted attribute', () => {
    const video = adapter.getElement() as HTMLVideoElement;
    expect(video.muted).toBe(true);
  });

  it('mounts into a container', () => {
    const container = document.createElement('div');
    adapter.mount(container);
    expect(container.querySelector('video')).toBeTruthy();
  });

  it('sets src on the video element', () => {
    const video = adapter.getElement() as HTMLVideoElement;
    expect(video.src).toContain('test.mp4');
  });

  it('creates source elements when sources provided', () => {
    const a = new HTML5Adapter({
      src: 'fallback.mp4',
      sources: [
        { src: 'video.webm', type: 'video/webm' },
        { src: 'video.mp4', type: 'video/mp4' },
      ],
    });
    const video = a.getElement() as HTMLVideoElement;
    const sources = video.querySelectorAll('source');
    expect(sources.length).toBe(2);
    expect(sources[0].src).toContain('video.webm');
    expect(sources[0].type).toBe('video/webm');
  });

  it('emits events via EventEmitter', () => {
    const handler = vi.fn();
    adapter.on('play', handler);

    // Simulate a play event on the underlying video element
    const video = adapter.getElement() as HTMLVideoElement;
    video.dispatchEvent(new Event('play'));

    expect(handler).toHaveBeenCalled();
  });

  it('reports ready = false initially', () => {
    expect(adapter.ready).toBe(false);
  });

  it('destroy removes the element', () => {
    const container = document.createElement('div');
    adapter.mount(container);
    expect(container.querySelector('video')).toBeTruthy();
    adapter.destroy();
    expect(container.querySelector('video')).toBeFalsy();
  });
});
