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

// === 2. Enhanced Shoppable Demo (Phase 2) ===
const countdownDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
new CIVideoHotspot('#demo-enhanced', {
  src: SAMPLE_VIDEO,
  trigger: 'click',
  pauseOnInteract: true,
  hotspotNavigation: true,
  timelineIndicators: 'dot',
  hotspots: [
    {
      id: 'enhanced-product',
      x: '45%',
      y: '40%',
      startTime: 3,
      endTime: 30,
      label: 'Premium Sneakers',
      animation: 'scale',
      data: {
        title: 'Premium Running Sneakers',
        price: '$129.99',
        originalPrice: '$179.99',
        badge: '-28%',
        description: 'Lightweight performance sneakers with responsive cushioning and breathable mesh upper.',
        images: [
          'https://picsum.photos/320/180?random=10',
          'https://picsum.photos/320/180?random=11',
          'https://picsum.photos/320/180?random=12',
          'https://picsum.photos/320/180?random=13',
        ],
        rating: 4.5,
        reviewCount: 238,
        wishlist: true,
        wishlisted: false,
        variants: [
          { id: 's7', type: 'size', label: '7', available: true },
          { id: 's8', type: 'size', label: '8', available: true, selected: true },
          { id: 's9', type: 'size', label: '9', available: true },
          { id: 's10', type: 'size', label: '10', available: true },
          { id: 's11', type: 'size', label: '11', available: false },
          { id: 'c-black', type: 'color', label: 'Black', color: '#1a1a1a', selected: true },
          { id: 'c-white', type: 'color', label: 'White', color: '#ffffff' },
          { id: 'c-red', type: 'color', label: 'Red', color: '#e53e3e' },
        ],
        countdown: countdownDate,
        countdownLabel: 'Sale ends in',
        customFields: [
          { label: 'Material', value: 'Mesh / Synthetic' },
          { label: 'Weight', value: '280g' },
          { label: 'Drop', value: '8mm' },
        ],
        sku: 'SNK-RUN-001',
        ctaText: 'Add to Cart',
        secondaryCta: {
          text: 'Quick View',
          onClick: (hotspot) => {
            console.log('Secondary CTA clicked for:', hotspot.id);
          },
        },
        onAddToCart: (event) => {
          console.log('Add to Cart:', event);
          console.log('  Hotspot:', event.hotspot.id);
          console.log('  Quantity:', event.quantity);
          console.log('  SKU:', event.sku);
          console.log('  Price:', event.price);
          console.log('  Selected Variants:', event.selectedVariants.map(v => `${v.type}: ${v.label}`).join(', '));
        },
        onWishlistToggle: (wishlisted, hotspot) => {
          console.log(`Wishlist ${wishlisted ? 'added' : 'removed'}: ${hotspot.id}`);
        },
        onVariantSelect: (variant, allSelected, hotspot) => {
          console.log(`Variant selected on ${hotspot.id}: ${variant.type} = ${variant.label}`);
          console.log('  All selected:', allSelected.map(v => `${v.type}: ${v.label}`).join(', '));
        },
      },
    },
  ],
  onHotspotShow(hotspot) {
    console.log('[Enhanced] Hotspot appeared:', hotspot.id);
  },
});

// === 3. Keyframe Motion Demo ===
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

// === 4. Chapters Demo ===
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

// === 5. Dark Theme ===
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

// === 6. HLS Stream Demo ===
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

// === 7. YouTube Demo ===
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

// === 8. Vimeo Demo ===
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

// === 9. Auto-Init ===
CIVideoHotspot.autoInit();
