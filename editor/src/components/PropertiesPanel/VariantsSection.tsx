import React from 'react';
import type { VideoHotspotItem } from 'js-cloudimage-video-hotspot';

interface ProductVariant {
  type: string;
  label: string;
  color?: string;
  available?: boolean;
}

interface VariantsSectionProps {
  hotspot: VideoHotspotItem;
  onChange: (updates: Partial<VideoHotspotItem>) => void;
}

export function VariantsSection({ hotspot, onChange }: VariantsSectionProps) {
  const data = hotspot.data || {};
  const variants: ProductVariant[] = (data as any).variants || [];

  const updateVariants = (newVariants: ProductVariant[]) => {
    onChange({ data: { ...data, variants: newVariants.length > 0 ? newVariants : undefined } as any });
  };

  const addVariant = () => {
    updateVariants([...variants, { type: 'size', label: '', available: true }]);
  };

  const removeVariant = (index: number) => {
    updateVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, updates: Partial<ProductVariant>) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], ...updates };
    updateVariants(newVariants);
  };

  return (
    <div className="editor-properties__section-content">
      {variants.map((v, i) => (
        <div key={i} className="editor-properties__variant-item">
          <div className="editor-properties__row">
            <select
              className="editor-input"
              value={v.type}
              onChange={e => updateVariant(i, { type: e.target.value })}
              style={{ width: 80 }}
            >
              <option value="size">Size</option>
              <option value="color">Color</option>
              <option value="material">Material</option>
              <option value="style">Style</option>
            </select>
            <input
              className="editor-input"
              type="text"
              value={v.label}
              onChange={e => updateVariant(i, { label: e.target.value })}
              placeholder="Label..."
            />
            <button className="editor-btn editor-btn--icon editor-btn--danger" onClick={() => removeVariant(i)} title="Remove">×</button>
          </div>
          <div className="editor-properties__row">
            {v.type === 'color' && (
              <>
                <span className="editor-properties__label">Color</span>
                <input
                  type="color"
                  value={v.color || '#000000'}
                  onChange={e => updateVariant(i, { color: e.target.value })}
                  style={{ width: 32, height: 24, padding: 0, border: 'none' }}
                />
              </>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginLeft: 'auto' }}>
              <input
                type="checkbox"
                checked={v.available !== false}
                onChange={e => updateVariant(i, { available: e.target.checked })}
              />
              Available
            </label>
          </div>
        </div>
      ))}
      <button className="editor-btn" onClick={addVariant} style={{ width: '100%', marginTop: 4 }}>
        + Add Variant
      </button>
    </div>
  );
}
