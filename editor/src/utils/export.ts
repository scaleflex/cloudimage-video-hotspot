import type { VideoHotspotItem } from 'js-cloudimage-video-hotspot';

export function exportToJson(hotspots: VideoHotspotItem[], videoUrl: string): string {
  const config = {
    src: videoUrl,
    hotspots: hotspots.map(h => ({
      id: h.id,
      x: h.x,
      y: h.y,
      startTime: h.startTime,
      endTime: h.endTime,
      label: h.label,
      ...(h.keyframes ? { keyframes: h.keyframes } : {}),
      ...(h.data ? { data: h.data } : {}),
      ...(h.markerStyle ? { markerStyle: h.markerStyle } : {}),
      ...(h.animation ? { animation: h.animation } : {}),
    })),
  };
  return JSON.stringify(config, null, 2);
}

export function exportToHtml(hotspots: VideoHotspotItem[], videoUrl: string): string {
  const json = exportToJson(hotspots, videoUrl);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Video Hotspots</title>
  <script src="https://cdn.jsdelivr.net/npm/js-cloudimage-video-hotspot/dist/index.umd.js"><\/script>
  <style>
    body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #111; }
    #player { width: 100%; max-width: 960px; }
  </style>
</head>
<body>
  <div id="player"></div>
  <script>
    new CIVideoHotspot('#player', ${json});
  <\/script>
</body>
</html>`;
}
