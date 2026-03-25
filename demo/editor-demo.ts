import { CIVideoHotspotEditor } from '../src/editor/index';

const VIDEO_URL = 'https://scaleflex.cloudimg.io/v7/plugins/js-cloudimage-video-hotspot/Rest%20room.mp4?vh=152b41&func=proxy';

const jsonOutput = document.getElementById('json-output');

const editor = new CIVideoHotspotEditor('#editor-root', {
  src: VIDEO_URL,
  sampleHotspots: true,
  onChange: (hotspots) => {
    const code = jsonOutput?.querySelector('code');
    if (code) code.textContent = JSON.stringify(hotspots, null, 2);
  },
});

// Initial JSON output
const code = jsonOutput?.querySelector('code');
if (code) code.textContent = editor.exportJSON();
