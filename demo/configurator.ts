import CIVideoHotspot from '../src';
import type { CIVideoHotspotConfig, MarkerStyle, HotspotAnimation } from '../src/core/types';

const SAMPLE_VIDEO = 'https://scaleflex.cloudimg.io/v7/plugins/js-cloudimage-video-hotspot/bed.mp4?vh=564790&func=proxy';

let instance: CIVideoHotspot | null = null;

function makeHotspots(style: MarkerStyle, animation: HotspotAnimation) {
  return [
    {
      id: 'hotspot-1',
      x: '39.4%',
      y: '50.48%',
      startTime: 0.7,
      endTime: 19.8,
      label: 'Television',
      interpolation: 'catmull-rom' as const,
      keyframes: [
        { time: 0.7, x: '39.4%', y: '50.48%' },
        { time: 19.8, x: '39.7%', y: '59.57%' },
      ],
      markerStyle: style !== 'dot' ? style : undefined,
      animation: animation !== 'fade' ? animation : undefined,
      data: {
        title: 'Smart Television',
        price: '$899',
        originalPrice: '$1,199',
        badge: '-25%',
        description: 'Ultra HD smart TV with immersive sound and streaming built-in.',
        image: 'https://scaleflex.cloudimg.io/v7/plugins/cloudimage/video-hotspot/Assets/modern%20smart%20TV.png?vh=0be5eb',
        ctaText: 'Shop Now',
      },
    },
    {
      id: 'hotspot-2',
      x: '81.94%',
      y: '66.98%',
      startTime: 6,
      endTime: 19.8,
      label: 'Pouf',
      interpolation: 'catmull-rom' as const,
      keyframes: [
        { time: 6, x: '81.94%', y: '66.98%' },
        { time: 19.8, x: '81.64%', y: '76.56%' },
      ],
      markerStyle: style !== 'dot' ? style : undefined,
      animation: animation !== 'fade' ? animation : undefined,
      data: {
        title: 'Knitted Pouf',
        price: '$79',
        description: 'Handcrafted knitted pouf — perfect as extra seating or a footrest.',
        image: 'https://scaleflex.cloudimg.io/v7/plugins/cloudimage/video-hotspot/Assets/leather%20pouf.png?vh=73e6a4',
        ctaText: 'Add to Cart',
      },
    },
    {
      id: 'hotspot-3',
      x: '51.04%',
      y: '61.66%',
      startTime: 1.4,
      endTime: 19.8,
      label: 'Fireplace',
      interpolation: 'catmull-rom' as const,
      keyframes: [
        { time: 1.4, x: '51.04%', y: '61.66%' },
        { time: 19.8, x: '47.76%', y: '96.83%' },
      ],
      markerStyle: style !== 'dot' ? style : undefined,
      animation: animation !== 'fade' ? animation : undefined,
      data: {
        title: 'Electric Fireplace',
        price: '$349',
        originalPrice: '$499',
        badge: '-30%',
        description: 'Modern electric fireplace with realistic flame effect and remote control.',
        image: 'https://scaleflex.cloudimg.io/v7/plugins/cloudimage/video-hotspot/Assets/freestanding%20fireplace.png?vh=b99fe7',
        ctaText: 'Shop Now',
      },
    },
  ];
}

export function initConfigurator(): void {
  const viewerEl = document.getElementById('cfg-viewer');
  if (!viewerEl) return;

  const cfgPauseInteract = document.getElementById('cfg-pause-interact') as HTMLInputElement;
  const cfgPulse = document.getElementById('cfg-pulse') as HTMLInputElement;
  const cfgTrigger = document.getElementById('cfg-trigger') as HTMLSelectElement;
  const cfgTheme = document.getElementById('cfg-theme') as HTMLSelectElement;
  const cfgPlacement = document.getElementById('cfg-placement') as HTMLSelectElement;
  const cfgMarkerStyle = document.getElementById('cfg-marker-style') as HTMLSelectElement;
  const cfgAnimation = document.getElementById('cfg-animation') as HTMLSelectElement;
  const cfgCode = document.querySelector('#cfg-code code') as HTMLElement;
  const cfgCopy = document.getElementById('cfg-copy') as HTMLButtonElement;

  function getConfig(): CIVideoHotspotConfig {
    const style = cfgMarkerStyle.value as MarkerStyle;
    const animation = cfgAnimation.value as HotspotAnimation;
    return {
      src: SAMPLE_VIDEO,
      hotspots: makeHotspots(style, animation),
      trigger: cfgTrigger.value as CIVideoHotspotConfig['trigger'],
      theme: cfgTheme.value as CIVideoHotspotConfig['theme'],
      placement: cfgPlacement.value as CIVideoHotspotConfig['placement'],
      pauseOnInteract: cfgPauseInteract.checked,
      hotspotNavigation: false,
      pulse: cfgPulse.checked,
      fullscreenButton: false,
      controls: false,
      autoplay: true,
      loop: true,
      muted: true,
      timelineIndicators: 'dot',
      hotspotAnimation: cfgAnimation.value as HotspotAnimation,
    };
  }

  function generateCode(config: CIVideoHotspotConfig): string {
    const opts: string[] = [];
    opts.push(`  src: '${config.src}',`);
    if (config.trigger !== 'click') opts.push(`  trigger: '${config.trigger}',`);
    if (config.theme !== 'light') opts.push(`  theme: '${config.theme}',`);
    if (!config.pauseOnInteract) opts.push(`  pauseOnInteract: false,`);
    if (!config.pulse) opts.push(`  pulse: false,`);
    if (config.placement !== 'top') opts.push(`  placement: '${config.placement}',`);
    if (config.hotspotAnimation !== 'fade') opts.push(`  hotspotAnimation: '${config.hotspotAnimation}',`);
    opts.push(
      `  hotspots: ${JSON.stringify(config.hotspots, null, 4)
        .split('\n')
        .map((l, i) => (i === 0 ? l : '  ' + l))
        .join('\n')},`,
    );
    return `const player = new CIVideoHotspot('#my-video', {\n${opts.join('\n')}\n});`;
  }

  function rebuild(): void {
    const config = getConfig();

    if (instance) {
      instance.update(config);
    } else {
      instance = new CIVideoHotspot(viewerEl!, config);
    }

    cfgCode.textContent = generateCode(config);
    cfgCode.classList.add('language-javascript');
    if (typeof (window as any).Prism !== 'undefined') {
      (window as any).Prism.highlightElement(cfgCode);
    }
  }

  // Bind controls
  [cfgPauseInteract, cfgPulse].forEach((el) =>
    el.addEventListener('change', rebuild),
  );
  [cfgTrigger, cfgTheme, cfgPlacement, cfgMarkerStyle, cfgAnimation].forEach((el) =>
    el.addEventListener('change', rebuild),
  );

  // Copy button
  cfgCopy.addEventListener('click', () => {
    navigator.clipboard.writeText(cfgCode.textContent || '').then(() => {
      cfgCopy.classList.add('copied');
      setTimeout(() => {
        cfgCopy.classList.remove('copied');
      }, 2000);
    });
  });

  // Initial build
  rebuild();
}
