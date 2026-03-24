import React from 'react';
import type { VideoHotspotItem } from 'js-cloudimage-video-hotspot';

interface PositionSectionProps {
  hotspot: VideoHotspotItem;
  onChange: (updates: Partial<VideoHotspotItem>) => void;
}

function parsePercent(val: string | number): string {
  if (typeof val === 'number') return val.toFixed(1);
  return parseFloat(val).toFixed(1);
}

export function PositionSection({ hotspot, onChange }: PositionSectionProps) {
  return (
    <div className="editor-properties__section-content">
      <div className="editor-properties__row">
        <span className="editor-properties__label">X</span>
        <input
          className="editor-input editor-input--small"
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={parsePercent(hotspot.x)}
          onChange={e => onChange({ x: `${e.target.value}%` })}
        />
        <span style={{ fontSize: 11, color: 'var(--editor-text-muted)' }}>%</span>
      </div>
      <div className="editor-properties__row">
        <span className="editor-properties__label">Y</span>
        <input
          className="editor-input editor-input--small"
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={parsePercent(hotspot.y)}
          onChange={e => onChange({ y: `${e.target.value}%` })}
        />
        <span style={{ fontSize: 11, color: 'var(--editor-text-muted)' }}>%</span>
      </div>
    </div>
  );
}
