import { useRef, useEffect } from 'react';
import type { CIVideoHotspotInstance } from '../core/types';
import type { UseCIVideoHotspotOptions, UseCIVideoHotspotReturn } from './types';
import { CIVideoHotspot } from '../core/ci-video-hotspot';

/** React hook for creating a CIVideoHotspot instance */
export function useCIVideoHotspot(options: UseCIVideoHotspotOptions): UseCIVideoHotspotReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<CIVideoHotspotInstance | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!containerRef.current) return;

    const instance = new CIVideoHotspot(containerRef.current, optionsRef.current);
    instanceRef.current = instance;

    return () => {
      instance.destroy();
      instanceRef.current = null;
    };
  // Re-create on src change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.src]);

  return {
    containerRef,
    instance: instanceRef,
  };
}
