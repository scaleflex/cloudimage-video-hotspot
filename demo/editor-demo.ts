import { CIVideoHotspotEditor } from '../src/editor/index';
import { HERO_VIDEO, viewerHotspots } from './sample-hotspots';

const jsonOutput = document.getElementById('json-output');

const editor = new CIVideoHotspotEditor('#editor-root', {
  src: HERO_VIDEO,
  hotspots: viewerHotspots,
  demoMode: import.meta.env.PROD,
  onChange: (hotspots) => {
    const code = jsonOutput?.querySelector('code');
    if (code) code.textContent = JSON.stringify(hotspots, null, 2);
  },
});

// Initial JSON output
const code = jsonOutput?.querySelector('code');
if (code) code.textContent = editor.exportJSON();
