import type { VideoHotspotItem } from 'js-cloudimage-video-hotspot';

export interface Template {
  name: string;
  description: string;
  hotspots: VideoHotspotItem[];
}

export const TEMPLATES: Template[] = [
  {
    name: 'Product Showcase',
    description: 'E-commerce product highlight with CTA',
    hotspots: [
      {
        id: 'product-1',
        x: '40%',
        y: '45%',
        startTime: 3,
        endTime: 15,
        label: 'Product Highlight',
        data: {
          title: 'Product Name',
          price: '$49.99',
          description: 'Product description goes here.',
          ctaText: 'Shop Now',
          url: '#',
        },
      },
    ],
  },
  {
    name: 'Tutorial',
    description: 'Step-by-step tutorial annotations',
    hotspots: [
      {
        id: 'step-1',
        x: '50%',
        y: '50%',
        startTime: 2,
        endTime: 10,
        label: 'Step 1',
        markerStyle: 'numbered',
        data: { title: 'Step 1', description: 'Click here to begin.' },
      },
      {
        id: 'step-2',
        x: '60%',
        y: '40%',
        startTime: 12,
        endTime: 20,
        label: 'Step 2',
        markerStyle: 'numbered',
        data: { title: 'Step 2', description: 'Next, do this.' },
      },
    ],
  },
  {
    name: 'Tour',
    description: 'Interactive video tour with multiple points of interest',
    hotspots: [
      {
        id: 'poi-1',
        x: '30%',
        y: '50%',
        startTime: 5,
        endTime: 20,
        label: 'Point of Interest 1',
        data: { title: 'Location A', description: 'Description of this location.' },
      },
      {
        id: 'poi-2',
        x: '70%',
        y: '40%',
        startTime: 25,
        endTime: 40,
        label: 'Point of Interest 2',
        data: { title: 'Location B', description: 'Description of this location.' },
      },
    ],
  },
];
