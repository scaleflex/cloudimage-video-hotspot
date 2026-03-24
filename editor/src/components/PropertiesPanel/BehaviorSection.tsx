import React from 'react';
import type { VideoHotspotItem } from 'js-cloudimage-video-hotspot';

interface BehaviorSectionProps {
  hotspot: VideoHotspotItem;
  onChange: (updates: Partial<VideoHotspotItem>) => void;
}

export function BehaviorSection({ hotspot, onChange }: BehaviorSectionProps) {
  const data = hotspot.data || {};

  const updateData = (field: string, value: any) => {
    onChange({ data: { ...data, [field]: value } as any });
  };

  return (
    <div className="editor-properties__section-content">
      <div className="editor-properties__row">
        <span className="editor-properties__label">Trigger</span>
        <select
          className="editor-input"
          value={hotspot.trigger || 'click'}
          onChange={e => onChange({ trigger: e.target.value as any })}
        >
          <option value="click">Click</option>
          <option value="hover">Hover</option>
        </select>
      </div>
      <div className="editor-properties__row">
        <span className="editor-properties__label">Placement</span>
        <select
          className="editor-input"
          value={hotspot.placement || 'auto'}
          onChange={e => onChange({ placement: e.target.value as any })}
        >
          <option value="auto">Auto</option>
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </div>
      <div className="editor-properties__row">
        <label className="editor-properties__checkbox-label">
          <input
            type="checkbox"
            checked={!!(data as any).pauseOnShow}
            onChange={e => updateData('pauseOnShow', e.target.checked || undefined)}
          />
          Pause on Show
        </label>
      </div>
      <div className="editor-properties__row">
        <label className="editor-properties__checkbox-label">
          <input
            type="checkbox"
            checked={!!(data as any).pauseOnInteract}
            onChange={e => updateData('pauseOnInteract', e.target.checked || undefined)}
          />
          Pause on Interact
        </label>
      </div>
      <div className="editor-properties__row">
        <label className="editor-properties__checkbox-label">
          <input
            type="checkbox"
            checked={!!(data as any).keepOpen}
            onChange={e => updateData('keepOpen', e.target.checked || undefined)}
          />
          Keep Open
        </label>
      </div>
    </div>
  );
}
