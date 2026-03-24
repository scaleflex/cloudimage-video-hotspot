import React from 'react';
import type { VideoHotspotItem } from 'js-cloudimage-video-hotspot';

interface ContentSectionProps {
  hotspot: VideoHotspotItem;
  onChange: (updates: Partial<VideoHotspotItem>) => void;
}

export function ContentSection({ hotspot, onChange }: ContentSectionProps) {
  const data = hotspot.data || {};

  const updateData = (field: string, value: string) => {
    onChange({ data: { ...data, [field]: value || undefined } });
  };

  return (
    <div className="editor-properties__section-content">
      <div className="editor-properties__row">
        <span className="editor-properties__label">Label</span>
        <input
          className="editor-input"
          type="text"
          value={hotspot.label}
          onChange={e => onChange({ label: e.target.value })}
        />
      </div>
      <div className="editor-properties__row">
        <span className="editor-properties__label">Title</span>
        <input
          className="editor-input"
          type="text"
          value={data.title || ''}
          onChange={e => updateData('title', e.target.value)}
        />
      </div>
      <div className="editor-properties__row">
        <span className="editor-properties__label">Price</span>
        <input
          className="editor-input"
          type="text"
          value={data.price || ''}
          onChange={e => updateData('price', e.target.value)}
          placeholder="$0.00"
        />
      </div>
      <div className="editor-properties__row">
        <span className="editor-properties__label">Image</span>
        <input
          className="editor-input"
          type="text"
          value={data.image || ''}
          onChange={e => updateData('image', e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="editor-properties__row">
        <span className="editor-properties__label">Desc</span>
        <textarea
          className="editor-input"
          value={data.description || ''}
          onChange={e => updateData('description', e.target.value)}
          rows={3}
          style={{ resize: 'vertical', minHeight: 60 }}
        />
      </div>
      <div className="editor-properties__row">
        <span className="editor-properties__label">CTA Text</span>
        <input
          className="editor-input"
          type="text"
          value={data.ctaText || ''}
          onChange={e => updateData('ctaText', e.target.value)}
        />
      </div>
      <div className="editor-properties__row">
        <span className="editor-properties__label">URL</span>
        <input
          className="editor-input"
          type="text"
          value={data.url || ''}
          onChange={e => updateData('url', e.target.value)}
          placeholder="https://..."
        />
      </div>
    </div>
  );
}
