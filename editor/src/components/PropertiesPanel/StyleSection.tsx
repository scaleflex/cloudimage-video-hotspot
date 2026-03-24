import React from 'react';
import type { VideoHotspotItem } from 'js-cloudimage-video-hotspot';

interface StyleSectionProps {
  hotspot: VideoHotspotItem;
  onChange: (updates: Partial<VideoHotspotItem>) => void;
}

export function StyleSection({ hotspot, onChange }: StyleSectionProps) {
  return (
    <div className="editor-properties__section-content">
      <div className="editor-properties__row">
        <span className="editor-properties__label">Marker</span>
        <select
          className="editor-input"
          value={hotspot.markerStyle || 'dot'}
          onChange={e => onChange({ markerStyle: e.target.value as any })}
        >
          <option value="dot">Dot</option>
          <option value="dot-label">Dot + Label</option>
          <option value="icon">Icon</option>
          <option value="numbered">Numbered</option>
        </select>
      </div>
      <div className="editor-properties__row">
        <span className="editor-properties__label">Animation</span>
        <select
          className="editor-input"
          value={hotspot.animation || 'fade'}
          onChange={e => onChange({ animation: e.target.value as any })}
        >
          <option value="fade">Fade</option>
          <option value="scale">Scale</option>
          <option value="none">None</option>
        </select>
      </div>
    </div>
  );
}
