import React from 'react';
import type { VideoHotspotItem } from 'js-cloudimage-video-hotspot';

interface GallerySectionProps {
  hotspot: VideoHotspotItem;
  onChange: (updates: Partial<VideoHotspotItem>) => void;
}

export function GallerySection({ hotspot, onChange }: GallerySectionProps) {
  const data = hotspot.data || {};
  const images: string[] = (data as any).images || [];

  const updateImages = (newImages: string[]) => {
    onChange({ data: { ...data, images: newImages.length > 0 ? newImages : undefined } as any });
  };

  const addImage = () => {
    updateImages([...images, '']);
  };

  const removeImage = (index: number) => {
    updateImages(images.filter((_, i) => i !== index));
  };

  const updateImage = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = value;
    updateImages(newImages);
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= images.length) return;
    const newImages = [...images];
    [newImages[index], newImages[newIdx]] = [newImages[newIdx], newImages[index]];
    updateImages(newImages);
  };

  return (
    <div className="editor-properties__section-content">
      {images.map((url, i) => (
        <div key={i} className="editor-properties__gallery-item">
          <input
            className="editor-input"
            type="text"
            value={url}
            onChange={e => updateImage(i, e.target.value)}
            placeholder="https://..."
          />
          <div className="editor-properties__gallery-actions">
            <button className="editor-btn editor-btn--icon" onClick={() => moveImage(i, -1)} disabled={i === 0} title="Move Up">↑</button>
            <button className="editor-btn editor-btn--icon" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} title="Move Down">↓</button>
            <button className="editor-btn editor-btn--icon editor-btn--danger" onClick={() => removeImage(i)} title="Remove">×</button>
          </div>
        </div>
      ))}
      <button className="editor-btn" onClick={addImage} style={{ width: '100%', marginTop: 4 }}>
        + Add Image
      </button>
    </div>
  );
}
