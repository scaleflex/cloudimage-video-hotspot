import React from 'react';
import type { VideoHotspotItem } from 'js-cloudimage-video-hotspot';

interface TimingSectionProps {
  hotspot: VideoHotspotItem;
  duration: number;
  onChange: (updates: Partial<VideoHotspotItem>) => void;
}

export function TimingSection({ hotspot, duration, onChange }: TimingSectionProps) {
  return (
    <div className="editor-properties__section-content">
      <div className="editor-properties__row">
        <span className="editor-properties__label">Start</span>
        <input
          className="editor-input editor-input--small"
          type="number"
          min="0"
          max={hotspot.endTime}
          step="0.1"
          value={hotspot.startTime}
          onChange={e => onChange({ startTime: parseFloat(e.target.value) || 0 })}
        />
        <span style={{ fontSize: 11, color: 'var(--editor-text-muted)' }}>s</span>
      </div>
      <div className="editor-properties__row">
        <span className="editor-properties__label">End</span>
        <input
          className="editor-input editor-input--small"
          type="number"
          min={hotspot.startTime}
          max={duration || 999}
          step="0.1"
          value={hotspot.endTime}
          onChange={e => onChange({ endTime: parseFloat(e.target.value) || 0 })}
        />
        <span style={{ fontSize: 11, color: 'var(--editor-text-muted)' }}>s</span>
      </div>
    </div>
  );
}
