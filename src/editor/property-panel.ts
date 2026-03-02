import type { VideoHotspotItem } from '../core/types';
import { createElement } from '../utils/dom';
import type { CIVideoHotspotEditor } from './ci-video-hotspot-editor';

export class PropertyPanel {
  private panelEl: HTMLElement;

  constructor(
    private parentEl: HTMLElement,
    private editor: CIVideoHotspotEditor,
  ) {
    this.panelEl = createElement('div', 'ci-editor-panel');
    this.parentEl.appendChild(this.panelEl);

    // Listen for selection changes
    this.editor.events.on('hotspot:select', () => this.refresh());
    this.editor.events.on('hotspot:deselect', () => this.refresh());

    this.refresh();
  }

  refresh(): void {
    const selectedId = this.editor.getSelection().getSelectedId();

    if (!selectedId) {
      this.renderHotspotList();
      return;
    }

    const hotspot = this.editor.getHotspot(selectedId);
    if (!hotspot) {
      this.renderHotspotList();
      return;
    }

    this.renderForm(hotspot);
  }

  private renderHotspotList(): void {
    this.panelEl.innerHTML = '';

    const title = createElement('div', 'ci-editor-panel-title');
    title.textContent = 'Hotspots';
    this.panelEl.appendChild(title);

    const hotspots = this.editor.getHotspots();

    if (hotspots.length === 0) {
      const empty = createElement('div', 'ci-editor-panel-empty');
      empty.textContent = 'No hotspots yet. Use the Add tool to place hotspots on the video.';
      this.panelEl.appendChild(empty);
      return;
    }

    const list = createElement('ul', 'ci-editor-hotspot-list');
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', 'Hotspot list');
    for (const h of hotspots) {
      const item = createElement('li', 'ci-editor-hotspot-item');
      item.setAttribute('data-list-id', h.id);
      item.setAttribute('role', 'option');
      item.setAttribute('tabindex', '0');

      const label = createElement('span', 'ci-editor-hotspot-item-label');
      label.textContent = h.label || h.id;

      const coords = createElement('span', 'ci-editor-hotspot-item-coords');
      coords.textContent = `${h.startTime}s – ${h.endTime}s`;

      item.appendChild(label);
      item.appendChild(coords);

      const selectHotspot = () => this.editor.getSelection().select(h.id);
      item.addEventListener('click', selectHotspot);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectHotspot();
        }
      });

      list.appendChild(item);
    }
    this.panelEl.appendChild(list);
  }

  private renderForm(hotspot: VideoHotspotItem): void {
    this.panelEl.innerHTML = '';
    this.fieldCounter = 0;

    const title = createElement('div', 'ci-editor-panel-title');
    title.textContent = `Edit: ${hotspot.label || hotspot.id}`;
    this.panelEl.appendChild(title);

    // Label
    this.panelEl.appendChild(
      this.createTextField('Label', hotspot.label || '', (val) => {
        this.editor.updateHotspot(hotspot.id, { label: val });
      }),
    );

    // Coordinates
    const coordRow = createElement('div', 'ci-editor-field-row');
    coordRow.appendChild(
      this.createTextField('X', String(hotspot.x), (val) => {
        this.editor.updateHotspot(hotspot.id, { x: val });
      }),
    );
    coordRow.appendChild(
      this.createTextField('Y', String(hotspot.y), (val) => {
        this.editor.updateHotspot(hotspot.id, { y: val });
      }),
    );
    this.panelEl.appendChild(coordRow);

    // Time fields
    const timeRow = createElement('div', 'ci-editor-field-row');
    timeRow.appendChild(
      this.createNumberField('Start Time', hotspot.startTime, 0, 0.1, (val) => {
        this.editor.updateHotspot(hotspot.id, { startTime: val });
      }),
    );
    timeRow.appendChild(
      this.createNumberField('End Time', hotspot.endTime, 0, 0.1, (val) => {
        this.editor.updateHotspot(hotspot.id, { endTime: val });
      }),
    );
    this.panelEl.appendChild(timeRow);

    // Trigger
    this.panelEl.appendChild(
      this.createSelect('Trigger', hotspot.trigger || 'click', ['hover', 'click'], (val) => {
        this.editor.updateHotspot(hotspot.id, { trigger: val as VideoHotspotItem['trigger'] });
      }),
    );

    // Placement
    this.panelEl.appendChild(
      this.createSelect(
        'Placement',
        hotspot.placement || 'top',
        ['top', 'bottom', 'left', 'right', 'auto'],
        (val) => {
          this.editor.updateHotspot(hotspot.id, { placement: val as VideoHotspotItem['placement'] });
        },
      ),
    );

    // Marker Style
    this.panelEl.appendChild(
      this.createSelect(
        'Marker Style',
        hotspot.markerStyle || 'dot',
        ['dot', 'dot-label', 'icon', 'numbered'],
        (val) => {
          this.editor.updateHotspot(hotspot.id, { markerStyle: val as VideoHotspotItem['markerStyle'] });
        },
      ),
    );

    // Animation
    this.panelEl.appendChild(
      this.createSelect(
        'Animation',
        hotspot.animation || 'fade',
        ['fade', 'scale', 'none'],
        (val) => {
          this.editor.updateHotspot(hotspot.id, { animation: val as VideoHotspotItem['animation'] });
        },
      ),
    );

    // Data fields
    const data = hotspot.data || {};

    this.panelEl.appendChild(
      this.createTextField('Title', data.title || '', (val) => {
        this.editor.updateHotspot(hotspot.id, {
          data: { ...hotspot.data, title: val },
        });
      }),
    );

    this.panelEl.appendChild(
      this.createTextField('Price', data.price || '', (val) => {
        this.editor.updateHotspot(hotspot.id, {
          data: { ...hotspot.data, price: val },
        });
      }),
    );

    this.panelEl.appendChild(
      this.createTextField('Original Price', data.originalPrice || '', (val) => {
        this.editor.updateHotspot(hotspot.id, {
          data: { ...hotspot.data, originalPrice: val },
        });
      }),
    );

    this.panelEl.appendChild(
      this.createTextArea('Description', data.description || '', (val) => {
        this.editor.updateHotspot(hotspot.id, {
          data: { ...hotspot.data, description: val },
        });
      }),
    );

    this.panelEl.appendChild(
      this.createTextField('Image URL', data.image || '', (val) => {
        this.editor.updateHotspot(hotspot.id, {
          data: { ...hotspot.data, image: val },
        });
      }),
    );

    this.panelEl.appendChild(
      this.createTextField('Link URL', data.url || '', (val) => {
        this.editor.updateHotspot(hotspot.id, {
          data: { ...hotspot.data, url: val },
        });
      }),
    );

    this.panelEl.appendChild(
      this.createTextField('CTA Text', data.ctaText || '', (val) => {
        this.editor.updateHotspot(hotspot.id, {
          data: { ...hotspot.data, ctaText: val },
        });
      }),
    );

    // Actions
    const actions = createElement('div', 'ci-editor-panel-actions');
    const deleteBtn = createElement('button', 'ci-editor-btn ci-editor-btn--danger');
    deleteBtn.textContent = 'Delete Hotspot';
    deleteBtn.addEventListener('click', () => this.editor.removeHotspot(hotspot.id));

    const backBtn = createElement('button', 'ci-editor-btn');
    backBtn.textContent = 'Back to List';
    backBtn.addEventListener('click', () => this.editor.getSelection().deselect());

    actions.appendChild(backBtn);
    actions.appendChild(deleteBtn);
    this.panelEl.appendChild(actions);
  }

  // === Field Builders ===

  private fieldCounter = 0;

  private nextFieldId(label: string): string {
    return `ci-editor-field-${label.toLowerCase().replace(/\s+/g, '-')}-${++this.fieldCounter}`;
  }

  private createTextField(
    label: string,
    value: string,
    onChange: (val: string) => void,
  ): HTMLElement {
    const id = this.nextFieldId(label);
    const field = createElement('div', 'ci-editor-field');
    const labelEl = createElement('label', '', { for: id });
    labelEl.textContent = label;
    const input = createElement('input', '', { id });
    input.type = 'text';
    input.value = value;
    input.addEventListener('change', () => onChange(input.value));
    field.appendChild(labelEl);
    field.appendChild(input);
    return field;
  }

  private createNumberField(
    label: string,
    value: number,
    min: number,
    step: number,
    onChange: (val: number) => void,
  ): HTMLElement {
    const id = this.nextFieldId(label);
    const field = createElement('div', 'ci-editor-field');
    const labelEl = createElement('label', '', { for: id });
    labelEl.textContent = label;
    const input = createElement('input', '', { id });
    input.type = 'number';
    input.value = String(value);
    input.min = String(min);
    input.step = String(step);
    input.addEventListener('change', () => {
      const num = parseFloat(input.value);
      if (!isNaN(num)) onChange(num);
    });
    field.appendChild(labelEl);
    field.appendChild(input);
    return field;
  }

  private createTextArea(
    label: string,
    value: string,
    onChange: (val: string) => void,
  ): HTMLElement {
    const id = this.nextFieldId(label);
    const field = createElement('div', 'ci-editor-field');
    const labelEl = createElement('label', '', { for: id });
    labelEl.textContent = label;
    const textarea = createElement('textarea', '', { id });
    textarea.value = value;
    textarea.addEventListener('change', () => onChange(textarea.value));
    field.appendChild(labelEl);
    field.appendChild(textarea);
    return field;
  }

  private createSelect(
    label: string,
    value: string,
    options: string[],
    onChange: (val: string) => void,
  ): HTMLElement {
    const id = this.nextFieldId(label);
    const field = createElement('div', 'ci-editor-field');
    const labelEl = createElement('label', '', { for: id });
    labelEl.textContent = label;
    const select = createElement('select', '', { id });
    for (const opt of options) {
      const option = createElement('option');
      option.value = opt;
      option.textContent = opt;
      if (opt === value) option.selected = true;
      select.appendChild(option);
    }
    select.addEventListener('change', () => onChange(select.value));
    field.appendChild(labelEl);
    field.appendChild(select);
    return field;
  }
}
