import CIVideoHotspot from '../src/index';
import { initConfigurator } from './configurator';

const SAMPLE_VIDEO = './3250231-uhd_3840_2160_25fps.mp4';

// ===== HERO =====
new CIVideoHotspot('#hero-viewer', {
  src: SAMPLE_VIDEO,
  trigger: 'click',
  pauseOnInteract: true,
  hotspotNavigation: true,
  timelineIndicators: 'dot',
  hotspots: [
    {
      id: 'hero-butterfly',
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
      id: 'hero-flower',
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
      id: 'hero-bunny',
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
});

// ===== FEATURES: Shoppable =====
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
});

// ===== FEATURES: Keyframes =====
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

// ===== FEATURES: Chapters =====
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
  ],
});

// ===== THEMES: Light =====
new CIVideoHotspot('#demo-light', {
  src: SAMPLE_VIDEO,
  trigger: 'click',
  hotspots: [
    {
      id: 'light-item',
      x: '50%',
      y: '50%',
      startTime: 3,
      endTime: 30,
      label: 'Light',
      data: { title: 'Light Theme', price: '$49.00', description: 'Default light popover styling.' },
    },
  ],
});

// ===== THEMES: Dark =====
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

// ===== THEMES: Enhanced =====
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
          { id: 'c-black', type: 'color', label: 'Black', color: '#1a1a1a', selected: true },
          { id: 'c-white', type: 'color', label: 'White', color: '#ffffff' },
          { id: 'c-red', type: 'color', label: 'Red', color: '#e53e3e' },
        ],
        countdown: countdownDate,
        countdownLabel: 'Sale ends in',
        customFields: [
          { label: 'Material', value: 'Mesh / Synthetic' },
          { label: 'Weight', value: '280g' },
        ],
        ctaText: 'Add to Cart',
        secondaryCta: {
          text: 'Quick View',
          onClick: (hotspot) => {
            console.log('Secondary CTA clicked for:', hotspot.id);
          },
        },
        onAddToCart: (event) => {
          console.log('Add to Cart:', event);
        },
      },
    },
  ],
});

// ===== PLAYERS: HLS =====
new CIVideoHotspot('#demo-hls', {
  src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
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

// ===== PLAYERS: YouTube =====
new CIVideoHotspot('#demo-youtube', {
  src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
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

// ===== PLAYERS: Vimeo =====
new CIVideoHotspot('#demo-vimeo', {
  src: 'https://vimeo.com/76979871',
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

// ===== ADVANCED: Custom Rendering =====
new CIVideoHotspot('#demo-custom-render', {
  src: SAMPLE_VIDEO,
  trigger: 'click',
  renderPopover: (hotspot) => {
    return `<div style="padding:20px;text-align:center">
      <h3 style="margin:0 0 8px;font-size:16px">${hotspot.data?.title || hotspot.label}</h3>
      <p style="color:#666;margin:0;font-size:13px">Custom rendered popover via <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:12px">renderPopover</code></p>
    </div>`;
  },
  hotspots: [
    {
      id: 'custom1',
      x: '50%',
      y: '50%',
      startTime: 3,
      endTime: 30,
      label: 'Custom',
      data: { title: 'Custom Popover' },
    },
  ],
});

// ===== ADVANCED: Icon Markers =====
new CIVideoHotspot('#demo-icons', {
  src: SAMPLE_VIDEO,
  trigger: 'click',
  hotspots: [
    {
      id: 'icon1',
      x: '30%',
      y: '40%',
      startTime: 3,
      endTime: 30,
      label: 'Shopping Cart',
      markerStyle: 'icon',
      icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
      pauseOnShow: true,
      keepOpen: true,
      data: { title: 'Icon Marker', description: 'SVG icon with pauseOnShow and keepOpen.' },
    },
    {
      id: 'icon2',
      x: '70%',
      y: '60%',
      startTime: 5,
      endTime: 25,
      label: 'Star',
      markerStyle: 'icon',
      icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
      data: { title: 'Another Icon', description: 'Star icon marker.' },
    },
  ],
});

// ===== ADVANCED: Poster & Autoplay =====
new CIVideoHotspot('#demo-poster', {
  src: SAMPLE_VIDEO,
  poster: 'https://picsum.photos/640/360?random=poster',
  autoplay: true,
  muted: true,
  loop: true,
  trigger: 'click',
  hotspots: [
    {
      id: 'poster1',
      x: '50%',
      y: '50%',
      startTime: 2,
      endTime: 999,
      label: 'Looping',
      data: { title: 'Poster + Autoplay', description: 'Video with poster, autoplay, muted, and loop.' },
    },
  ],
});

// ===== PROGRAMMATIC API =====
const apiPlayer = new CIVideoHotspot('#demo-api', {
  src: SAMPLE_VIDEO,
  trigger: 'click',
  pauseOnInteract: true,
  hotspots: [
    {
      id: 'api-1',
      x: '30%',
      y: '40%',
      startTime: 3,
      endTime: 30,
      label: 'Item 1',
      data: { title: 'First Item', price: '$19.99' },
    },
    {
      id: 'api-2',
      x: '70%',
      y: '60%',
      startTime: 10,
      endTime: 40,
      label: 'Item 2',
      data: { title: 'Second Item', price: '$29.99' },
    },
  ],
});

let apiCounter = 3;
document.getElementById('api-add')?.addEventListener('click', () => {
  const currentTime = (apiPlayer as any).getCurrentTime?.() ?? 5;
  apiPlayer.addHotspot({
    id: `api-${apiCounter}`,
    x: `${Math.random() * 80 + 10}%`,
    y: `${Math.random() * 80 + 10}%`,
    startTime: currentTime,
    endTime: currentTime + 15,
    label: `Item ${apiCounter}`,
    data: { title: `Dynamic Item ${apiCounter}` },
  });
  apiCounter++;
});

document.getElementById('api-remove')?.addEventListener('click', () => {
  const hotspots = (apiPlayer as any).getHotspots?.() ?? [];
  if (hotspots.length > 0) {
    apiPlayer.removeHotspot(hotspots[hotspots.length - 1].id);
  }
});

document.getElementById('api-open')?.addEventListener('click', () => {
  apiPlayer.open('api-1');
});

document.getElementById('api-close')?.addEventListener('click', () => {
  apiPlayer.closeAll();
});

document.getElementById('api-next')?.addEventListener('click', () => {
  apiPlayer.nextHotspot();
});

document.getElementById('api-prev')?.addEventListener('click', () => {
  apiPlayer.prevHotspot();
});

// ===== AUTO-INIT =====
CIVideoHotspot.autoInit();

// ===== CONFIGURATOR =====
initConfigurator();

// ===== NAV: scroll shadow + active section highlighting =====
const nav = document.getElementById('demo-nav');
const navLinks = document.querySelectorAll<HTMLAnchorElement>('.demo-nav-links a[href^="#"]');
const sections = document.querySelectorAll<HTMLElement>('main section[id]');

function updateNav(): void {
  if (nav) {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }

  let currentId = '';
  const offset = 120;
  for (const section of sections) {
    if (section.offsetTop - offset <= window.scrollY) {
      currentId = section.id;
    }
  }
  for (const link of navLinks) {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === `#${currentId}`);
  }
}

// Smooth scroll for nav link clicks
for (const link of navLinks) {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (!href?.startsWith('#')) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    const navHeight = nav ? nav.offsetHeight : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;
    window.scrollTo({ top, behavior: 'smooth' });
  });
}

window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

// ===== Mobile burger menu =====
const burger = document.getElementById('nav-burger');
if (nav && burger) {
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });

  const allNavLinks = document.querySelectorAll<HTMLAnchorElement>('.demo-nav-links a');
  for (const link of allNavLinks) {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  }
}

// ===== Also by Scaleflex — slide auto-rotation =====
{
  const slides = document.querySelectorAll<HTMLElement>('.demo-also-slide');
  const dotsContainer = document.getElementById('also-dots');
  if (slides.length > 0 && dotsContainer) {
    let current = 0;
    let animating = false;
    let timer: ReturnType<typeof setInterval>;

    for (let i = 0; i < slides.length; i++) {
      const dot = document.createElement('button');
      dot.className = `demo-also-dot${i === 0 ? ' demo-also-dot--active' : ''}`;
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    }

    function clearAnimClasses(el: HTMLElement) {
      el.classList.remove(
        'demo-also-slide--enter-right',
        'demo-also-slide--enter-left',
        'demo-also-slide--leave-left',
        'demo-also-slide--leave-right',
      );
    }

    function goTo(index: number) {
      if (index === current || animating) return;
      animating = true;
      const forward = index > current || (current === slides.length - 1 && index === 0);
      const prev = slides[current];
      const next = slides[index];

      clearAnimClasses(prev);
      prev.classList.remove('demo-also-slide--active');
      prev.classList.add(forward ? 'demo-also-slide--leave-left' : 'demo-also-slide--leave-right');

      clearAnimClasses(next);
      next.classList.add(forward ? 'demo-also-slide--enter-right' : 'demo-also-slide--enter-left');

      next.addEventListener('animationend', function handler() {
        next.removeEventListener('animationend', handler);
        clearAnimClasses(prev);
        clearAnimClasses(next);
        next.classList.add('demo-also-slide--active');
        animating = false;
      });

      current = index;
      dotsContainer!.querySelectorAll('.demo-also-dot').forEach((d, i) => {
        d.classList.toggle('demo-also-dot--active', i === current);
      });
      resetTimer();
    }

    function resetTimer() {
      clearInterval(timer);
      timer = setInterval(() => {
        goTo((current + 1) % slides.length);
      }, 5000);
    }

    resetTimer();
  }
}
