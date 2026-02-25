import CIVideoHotspot from 'js-cloudimage-video-hotspot';

// === Sample video URLs (public domain / CC) ===
const SAMPLE_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

// === 1. Shoppable Video Demo ===
new CIVideoHotspot('#demo-shoppable', {
  src: SAMPLE_VIDEO,
  trigger: 'click',
  pauseOnInteract: true,
  hotspotNavigation: true,
  timelineIndicators: 'dot',
  hotspots: [
    {
      id: 'butterfly',
      x: '35%',
      y: '40%',
      startTime: 5,
      endTime: 15,
      label: 'Butterfly',
      animation: 'scale',
      data: {
        title: 'Beautiful Butterfly',
        price: '$29.99',
        originalPrice: '$49.99',
        badge: '-40%',
        description: 'A gorgeous butterfly captured in nature.',
        image: 'https://picsum.photos/320/180?random=1',
        url: '#',
        ctaText: 'Shop Now',
      },
    },
    {
      id: 'flower',
      x: '65%',
      y: '60%',
      startTime: 12,
      endTime: 25,
      label: 'Wildflower',
      data: {
        title: 'Wild Sunflower',
        price: '$12.99',
        description: 'Fresh wildflowers delivered to your door.',
        url: '#',
        ctaText: 'Add to Cart',
      },
    },
    {
      id: 'bunny',
      x: '50%',
      y: '45%',
      startTime: 30,
      endTime: 45,
      label: 'Big Buck Bunny',
      markerStyle: 'dot-label',
      data: {
        title: 'Big Buck Bunny Plush',
        price: '$39.99',
        description: 'Adorable plush toy based on the iconic character.',
        image: 'https://picsum.photos/320/180?random=2',
        url: '#',
        ctaText: 'Buy Now',
      },
    },
  ],
  onHotspotShow(hotspot) {
    console.log('Hotspot appeared:', hotspot.id);
  },
  onHotspotClick(_event, hotspot) {
    console.log('Hotspot clicked:', hotspot.id);
  },
});

// === 2. Keyframe Motion Demo ===
new CIVideoHotspot('#demo-keyframes', {
  src: SAMPLE_VIDEO,
  trigger: 'click',
  pauseOnInteract: true,
  hotspotAnimation: 'fade',
  timelineIndicators: 'range',
  hotspots: [
    {
      id: 'tracker',
      x: '20%',
      y: '50%',
      startTime: 3,
      endTime: 20,
      label: 'Moving Object',
      easing: 'ease-in-out',
      keyframes: [
        { time: 3, x: '20%', y: '50%' },
        { time: 8, x: '40%', y: '35%' },
        { time: 13, x: '60%', y: '55%' },
        { time: 18, x: '80%', y: '40%' },
        { time: 20, x: '70%', y: '50%' },
      ],
      data: {
        title: 'Tracked Object',
        description: 'This hotspot follows a path across the video using keyframe interpolation.',
      },
    },
    {
      id: 'static-marker',
      x: '50%',
      y: '30%',
      startTime: 10,
      endTime: 30,
      label: 'Static Reference',
      data: {
        title: 'Static Marker',
        description: 'This one stays in place while the other moves.',
      },
    },
  ],
});

// === 3. Chapters Demo ===
new CIVideoHotspot('#demo-chapters', {
  src: SAMPLE_VIDEO,
  trigger: 'click',
  pauseOnInteract: true,
  chapterNavigation: true,
  chapters: [
    { id: 'intro', title: 'Introduction', startTime: 0 },
    { id: 'nature', title: 'Nature Scene', startTime: 30 },
    { id: 'action', title: 'The Chase', startTime: 60 },
    { id: 'ending', title: 'Grand Finale', startTime: 120 },
  ],
  hotspots: [
    {
      id: 'ch1-item',
      x: '40%',
      y: '50%',
      startTime: 5,
      endTime: 20,
      label: 'Intro Item',
      chapterId: 'intro',
      data: { title: 'Chapter 1 Item', description: 'Part of the introduction chapter.' },
    },
    {
      id: 'ch2-item',
      x: '60%',
      y: '40%',
      startTime: 35,
      endTime: 55,
      label: 'Nature Item',
      chapterId: 'nature',
      data: { title: 'Chapter 2 Item', description: 'Discovered in the nature scene.' },
    },
    {
      id: 'ch3-item',
      x: '30%',
      y: '60%',
      startTime: 65,
      endTime: 90,
      label: 'Action Item',
      chapterId: 'action',
      data: { title: 'Chapter 3 Item', description: 'Found during the chase!' },
    },
  ],
});

// === 4. Dark Theme ===
new CIVideoHotspot('#demo-dark', {
  src: SAMPLE_VIDEO,
  theme: 'dark',
  trigger: 'click',
  hotspots: [
    {
      id: 'dark-item',
      x: '50%',
      y: '50%',
      startTime: 3,
      endTime: 30,
      label: 'Dark Theme Item',
      data: {
        title: 'Dark Mode',
        description: 'This popover uses the dark theme with inverted colors.',
        price: '$99.00',
      },
    },
  ],
});

// === 5. HLS Stream Demo ===
// Requires: npm i hls.js (peer dependency)
// Uses auto-detection via .m3u8 extension
new CIVideoHotspot('#demo-hls', {
  src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  // playerType: 'hls',  ← auto-detected from .m3u8
  trigger: 'click',
  pauseOnInteract: true,
  hotspots: [
    {
      id: 'hls-item',
      x: '50%',
      y: '50%',
      startTime: 2,
      endTime: 30,
      label: 'HLS Stream Hotspot',
      data: {
        title: 'HLS Adaptive Stream',
        description: 'This video is streamed via HLS (.m3u8). Quality adapts to bandwidth.',
      },
    },
  ],
});

// === 6. YouTube Demo ===
// No dependencies needed — YouTube IFrame API is loaded dynamically
new CIVideoHotspot('#demo-youtube', {
  src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  // playerType: 'youtube',  ← auto-detected from URL
  trigger: 'click',
  pauseOnInteract: true,
  hotspots: [
    {
      id: 'yt-item',
      x: '50%',
      y: '40%',
      startTime: 3,
      endTime: 30,
      label: 'YouTube Hotspot',
      data: {
        title: 'YouTube Video',
        description: 'Hotspots work over YouTube embeds with full playback control.',
      },
    },
  ],
});

// === 7. Vimeo Demo ===
// Requires: npm i @vimeo/player (peer dependency) or loads from CDN
new CIVideoHotspot('#demo-vimeo', {
  src: 'https://vimeo.com/76979871',
  // playerType: 'vimeo',  ← auto-detected from URL
  trigger: 'click',
  pauseOnInteract: true,
  hotspots: [
    {
      id: 'vimeo-item',
      x: '40%',
      y: '50%',
      startTime: 5,
      endTime: 30,
      label: 'Vimeo Hotspot',
      data: {
        title: 'Vimeo Video',
        description: 'Hotspots work over Vimeo embeds too.',
      },
    },
  ],
});

// === 8. Auto-Init ===
CIVideoHotspot.autoInit();
