import { CIVideoHotspotEditor } from '../src/editor/index';

const DEMO_VIDEO = './3250231-uhd_3840_2160_25fps.mp4';

const jsonOutput = document.getElementById('json-output')!;

const editor = new CIVideoHotspotEditor('#editor-root', {
  src: DEMO_VIDEO,
  hotspots: [
    {
      id: 'scene-intro',
      x: '35%',
      y: '40%',
      startTime: 5,
      endTime: 20,
      label: 'Opening Scene',
      data: {
        title: 'Opening Scene',
        description: 'The story begins here with a beautiful sunrise.',
      },
    },
    {
      id: 'main-char',
      x: '55%',
      y: '55%',
      startTime: 25,
      endTime: 45,
      label: 'Big Buck Bunny',
      data: {
        title: 'Big Buck Bunny',
        description: 'The main character of the story.',
      },
    },
    {
      id: 'nature',
      x: '70%',
      y: '30%',
      startTime: 50,
      endTime: 80,
      label: 'Forest Scenery',
      data: {
        title: 'Forest Scenery',
        description: 'Beautiful forest background with rich details.',
      },
    },
  ],
  onChange: (hotspots) => {
    jsonOutput.textContent = JSON.stringify(hotspots, null, 2);
  },
});

// Initial render of JSON
jsonOutput.textContent = editor.exportJSON();
