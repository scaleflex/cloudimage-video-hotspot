import type { CIVideoHotspotEditor } from './ci-video-hotspot-editor';

export class CardEditor {
  private editor: CIVideoHotspotEditor;
  private overlayEl: HTMLElement;
  private modalEl: HTMLElement;
  private escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.close();
  };

  constructor(editor: CIVideoHotspotEditor, overlayEl: HTMLElement, modalEl: HTMLElement) {
    this.editor = editor;
    this.overlayEl = overlayEl;
    this.modalEl = modalEl;
  }

  open(hotspotId: string): void {
    const hotspot = this.editor.getHotspots().find(h => h.id === hotspotId);
    if (!hotspot) return;

    const data: Record<string, string> = { ...(hotspot.data || {}) } as Record<string, string>;
    this.overlayEl.classList.add('card-editor-overlay--visible');
    this.modalEl.innerHTML = '';

    const title = el('h3', 'card-editor-title');
    title.textContent = 'Edit Hotspot Card';
    this.modalEl.appendChild(title);

    const fields: Array<{ key: string; label: string; type: 'text' | 'textarea' }> = [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'price', label: 'Price', type: 'text' },
      { key: 'originalPrice', label: 'Original Price', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'image', label: 'Image URL', type: 'text' },
      { key: 'url', label: 'Link URL', type: 'text' },
      { key: 'ctaText', label: 'CTA Button Text', type: 'text' },
      { key: 'badge', label: 'Badge', type: 'text' },
    ];

    fields.forEach(({ key, label, type }) => {
      const field = el('div', 'card-editor-field');
      const lbl = el('label');
      lbl.textContent = label;
      field.appendChild(lbl);

      if (type === 'textarea') {
        const ta = el('textarea') as HTMLTextAreaElement;
        ta.value = data[key] || '';
        ta.addEventListener('input', () => { data[key] = ta.value; });
        field.appendChild(ta);
      } else {
        const inp = el('input') as HTMLInputElement;
        inp.type = 'text';
        inp.value = data[key] || '';
        inp.addEventListener('input', () => { data[key] = inp.value; });
        field.appendChild(inp);
      }
      this.modalEl.appendChild(field);
    });

    // Actions
    const actions = el('div', 'card-editor-actions');
    const cancelBtn = el('button', 'card-editor-btn card-editor-btn--cancel');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.close());
    const saveBtn = el('button', 'card-editor-btn card-editor-btn--save');
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => {
      this.editor.pushUndo();
      hotspot.data = { ...data };
      this.editor.syncHotspot(hotspotId);
      this.editor.notifyChange();
      this.close();
    });
    actions.append(cancelBtn, saveBtn);
    this.modalEl.appendChild(actions);

    // Close on overlay click or Escape
    this.overlayEl.addEventListener('click', (e) => {
      if (e.target === this.overlayEl) this.close();
    });
    document.addEventListener('keydown', this.escHandler);
  }

  close(): void {
    this.overlayEl.classList.remove('card-editor-overlay--visible');
    document.removeEventListener('keydown', this.escHandler);
  }
}

function el(tag: string, className?: string): HTMLElement {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}
