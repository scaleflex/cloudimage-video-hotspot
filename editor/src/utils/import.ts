import type { VideoHotspotItem } from 'js-cloudimage-video-hotspot';

interface ImportedConfig {
  src?: string;
  hotspots?: VideoHotspotItem[];
}

export function importFromJson(jsonString: string): { hotspots: VideoHotspotItem[]; videoUrl?: string } {
  const parsed: ImportedConfig = JSON.parse(jsonString);

  if (!parsed.hotspots || !Array.isArray(parsed.hotspots)) {
    throw new Error('Invalid config: missing "hotspots" array');
  }

  // Validate each hotspot has required fields
  for (const h of parsed.hotspots) {
    if (!h.id || h.startTime == null || h.endTime == null) {
      throw new Error(`Invalid hotspot: missing required fields (id, startTime, endTime)`);
    }
    if (h.x == null || h.y == null) {
      throw new Error(`Hotspot "${h.id}": missing x/y coordinates`);
    }
    if (!h.label) {
      h.label = h.id; // Fallback
    }
  }

  return {
    hotspots: parsed.hotspots,
    videoUrl: parsed.src,
  };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
