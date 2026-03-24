import React from 'react';
import type { VideoHotspotItem } from 'js-cloudimage-video-hotspot';

interface HotspotListItemProps {
  hotspot: VideoHotspotItem;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function HotspotListItem({ hotspot, selected, onSelect, onDelete }: HotspotListItemProps) {
  return (
    <div
      className={`editor-hotspot-item ${selected ? 'editor-hotspot-item--selected' : ''}`}
      onClick={onSelect}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="editor-hotspot-item__label">{hotspot.label}</span>
        <button
          className="editor-btn editor-btn--danger editor-btn--icon"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete"
          style={{ padding: '2px 6px', fontSize: '10px' }}
        >
          ✕
        </button>
      </div>
      <span className="editor-hotspot-item__time">
        {formatTime(hotspot.startTime)} – {formatTime(hotspot.endTime)}
      </span>
    </div>
  );
}
