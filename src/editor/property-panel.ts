import type { VideoHotspotItem, MarkerStyle, TriggerMode, Placement, HotspotAnimation, InterpolationMode } from '../core/types';
import type { CIVideoHotspotEditor } from './ci-video-hotspot-editor';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#06b6d4', '#f97316', '#a855f7'];

export class PropertyPanel {
  private editor: CIVideoHotspotEditor;
  private sidebarEl: HTMLElement;

  constructor(sidebarEl: HTMLElement, editor: CIVideoHotspotEditor) {
    this.sidebarEl = sidebarEl;
    this.editor = editor;
  }

  render(): void {
    const sidebar = this.sidebarEl;
    const mode = this.editor.getMode();

    if (mode === 'view') {
      sidebar.classList.add('app-sidebar--hidden');
      return;
    }
    sidebar.classList.remove('app-sidebar--hidden');
    sidebar.innerHTML = '';

    const selection = this.editor.getSelection();
    const selectedHotspotId = selection.getSelectedHotspotId();
    const selectedPointIndex = selection.getSelectedPointIndex();
    const hotspots = this.editor.getHotspots();

    // Header
    const header = el('div', 'sidebar-header');
    const title = el('h2');
    title.textContent = 'Hotspots';
    const placementMode = this.editor.isPlacementMode();
    const addBtn = el('button', `sidebar-add-btn${placementMode ? ' sidebar-add-btn--active' : ''}`);
    addBtn.textContent = placementMode ? 'Click to place…' : '+ Add Hotspot';
    addBtn.addEventListener('click', () => this.editor.togglePlacementMode());
    header.appendChild(title);
    header.appendChild(addBtn);
    sidebar.appendChild(header);

    // Global settings panel
    const settingsPanel = el('div', 'sidebar-settings');
    const settingsTitle = el('div', 'sidebar-settings-title');
    settingsTitle.textContent = 'General settings';
    settingsPanel.appendChild(settingsTitle);

    // Trigger
    settingsPanel.appendChild(this.buildSettingRow('Trigger', ['click', 'hover'], this.editor.getGlobalTrigger(), (v) => {
      this.editor.setGlobalTrigger(v as TriggerMode);
    }));

    // Pause on interact
    settingsPanel.appendChild(this.buildSettingRow('Pause on interact',
      [{ value: 'true', label: 'On' }, { value: 'false', label: 'Off' }],
      String(this.editor.getGlobalPauseOnInteract()),
      (v) => this.editor.setGlobalPauseOnInteract(v === 'true'),
    ));

    // Marker
    const markerOptions: MarkerStyle[] = ['dot', 'dot-label', 'numbered'];
    settingsPanel.appendChild(this.buildSettingRow('Marker',
      markerOptions.map(opt => ({ value: opt, label: opt === 'dot-label' ? 'Label' : opt.charAt(0).toUpperCase() + opt.slice(1) })),
      this.editor.getGlobalMarkerStyle(),
      (v) => this.editor.setGlobalMarkerStyle(v as MarkerStyle),
    ));

    sidebar.appendChild(settingsPanel);

    // Hotspot list
    const list = el('div', 'sidebar-list');
    hotspots.forEach((h, hIdx) => {
      const isSelected = h.id === selectedHotspotId;
      const item = el('div', `hotspot-item${isSelected ? ' hotspot-item--selected' : ''}`);

      // Header row
      const hdr = el('div', 'hotspot-item-header');
      hdr.addEventListener('click', () => {
        if (selectedHotspotId === h.id) {
          selection.deselect();
        } else {
          selection.select(h.id);
        }
        this.editor.refresh();
      });

      const colorDot = el('span', 'hotspot-item-color');
      colorDot.style.backgroundColor = COLORS[hIdx % COLORS.length];
      const name = el('span', 'hotspot-item-name');
      name.textContent = h.label || h.id;
      const time = el('span', 'hotspot-item-time');
      time.textContent = `${fmtTime(h.startTime)} – ${fmtTime(h.endTime)}`;
      const chevron = el('span', 'hotspot-item-chevron');
      chevron.textContent = '\u25BE';

      hdr.append(colorDot, name, time, chevron);
      item.appendChild(hdr);

      // Expanded body
      if (isSelected) {
        const body = el('div', 'hotspot-item-body');
        body.style.display = 'block';

        // Name input
        const nameInput = el('input', 'hotspot-name-input') as HTMLInputElement;
        nameInput.value = h.label;
        nameInput.addEventListener('change', () => {
          h.label = nameInput.value;
          this.editor.refresh();
        });
        const nameLabel = el('label', 'hotspot-name-label');
        nameLabel.textContent = 'Label';
        body.appendChild(nameLabel);
        body.appendChild(nameInput);

        // Points header
        const ptsHeader = el('div', 'points-header');
        const ptsTitle = el('span', 'points-title');
        ptsTitle.textContent = 'All Points';
        ptsHeader.appendChild(ptsTitle);
        body.appendChild(ptsHeader);

        // Points list
        const kfs = h.keyframes || [];
        kfs.forEach((kf, kfIdx) => {
          const isPointSelected = selectedPointIndex === kfIdx;
          const row = el('div', `point-row${isPointSelected ? ' point-row--selected' : ''}`);
          row.addEventListener('click', () => {
            selection.selectPoint(h.id, kfIdx);
            this.editor.refresh();
          });

          const label = el('span', 'point-row-label');
          label.textContent = `Point ${kfIdx + 1}`;

          const delPointBtn = el('button', 'point-row-delete');
          delPointBtn.textContent = '\u00D7';
          delPointBtn.title = 'Delete point';
          delPointBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editor.deleteKeyframe(h.id, kfIdx);
          });

          if (isPointSelected) {
            const topLine = el('div', 'point-row-top');
            topLine.append(label, delPointBtn);
            row.appendChild(topLine);

            const bottomLine = el('div', 'point-row-bottom');
            const timeField = el('div', 'point-row-fields');
            timeField.appendChild(inlineTimeField('Time', kf.time, (v) => this.editor.updateKeyframe(h.id, kfIdx, 'time', v)));
            bottomLine.appendChild(timeField);
            bottomLine.appendChild(inlineField('X', parseCoord(kf.x), (v) => this.editor.updateKeyframe(h.id, kfIdx, 'x', v)));
            bottomLine.appendChild(inlineField('Y', parseCoord(kf.y), (v) => this.editor.updateKeyframe(h.id, kfIdx, 'y', v)));
            row.appendChild(bottomLine);
            body.appendChild(row);
          } else {
            const info = el('span', 'point-row-info');
            info.textContent = fmtTime(kf.time);
            row.append(label, info, delPointBtn);
            body.appendChild(row);
          }
        });

        // Customize section
        const custHeader = el('div', 'customize-header');
        const custTitle = el('span', 'customize-title');
        custTitle.textContent = 'Customize';
        custHeader.appendChild(custTitle);
        body.appendChild(custHeader);

        const custGrid = el('div', 'customize-grid');

        custGrid.appendChild(sidebarSelect('Placement', ['top', 'bottom', 'left', 'right', 'auto'], h.placement, 'top', (v) => {
          this.editor.pushUndo();
          h.placement = v as Placement;
          this.editor.syncHotspot(h.id);
          this.editor.notifyChange();
        }));

        custGrid.appendChild(sidebarSelect('Animation', ['fade', 'scale', 'none'], h.animation, 'fade', (v) => {
          this.editor.pushUndo();
          h.animation = v as HotspotAnimation;
          this.editor.syncHotspot(h.id);
          this.editor.notifyChange();
        }));

        custGrid.appendChild(sidebarSelect('Interpolation', ['linear', 'catmull-rom'], h.interpolation, 'catmull-rom', (v) => {
          this.editor.pushUndo();
          h.interpolation = v as InterpolationMode;
          this.editor.syncHotspot(h.id);
          this.editor.notifyChange();
        }));

        // Auto Open checkbox
        custGrid.appendChild(this.buildCheckbox('Auto Open Card', h.autoOpen === true, (checked) => {
          this.editor.pushUndo();
          h.autoOpen = checked;
          this.editor.syncHotspot(h.id);
          this.editor.notifyChange();
        }));

        // Pause on interact checkbox
        custGrid.appendChild(this.buildCheckbox('Pause on interact',
          h.pauseOnInteract !== undefined ? h.pauseOnInteract : this.editor.getGlobalPauseOnInteract(),
          (checked) => {
            this.editor.pushUndo();
            h.pauseOnInteract = checked;
            this.editor.syncHotspot(h.id);
            this.editor.notifyChange();
          }));

        body.appendChild(custGrid);

        // Actions
        const actions = el('div', 'hotspot-actions');
        const cardBtn = el('button', 'hotspot-btn hotspot-btn--card');
        cardBtn.textContent = 'Fill Card';
        cardBtn.addEventListener('click', () => this.editor.openCardEditor(h.id));
        const delBtn = el('button', 'hotspot-btn hotspot-btn--delete');
        delBtn.textContent = 'Delete';
        delBtn.addEventListener('click', () => this.editor.deleteHotspot(h.id));
        actions.append(cardBtn, delBtn);
        body.appendChild(actions);

        item.appendChild(body);
      }

      list.appendChild(item);
    });
    sidebar.appendChild(list);
  }

  private buildSettingRow(label: string, options: (string | { value: string; label: string })[], current: string, onChange: (v: string) => void): HTMLElement {
    const row = el('div', 'sidebar-setting__row');
    const lbl = el('span', 'sidebar-setting__label');
    lbl.textContent = label;
    const select = document.createElement('select') as HTMLSelectElement;
    select.className = 'sidebar-setting__select';
    for (const opt of options) {
      const value = typeof opt === 'string' ? opt : opt.value;
      const text = typeof opt === 'string' ? opt.charAt(0).toUpperCase() + opt.slice(1) : opt.label;
      const o = document.createElement('option');
      o.value = value;
      o.textContent = text;
      if (current === value) o.selected = true;
      select.appendChild(o);
    }
    select.addEventListener('change', () => onChange(select.value));
    row.append(lbl, select);
    return row;
  }

  private buildCheckbox(label: string, checked: boolean, onChange: (checked: boolean) => void): HTMLElement {
    const row = el('div', 'customize-checkbox-row');
    const lbl = el('label', 'customize-checkbox-label');
    const cb = el('input', 'customize-checkbox') as HTMLInputElement;
    cb.type = 'checkbox';
    cb.checked = checked;
    cb.addEventListener('change', () => onChange(cb.checked));
    const text = el('span');
    text.textContent = label;
    lbl.append(cb, text);
    row.appendChild(lbl);
    return row;
  }
}

// ── Helpers ──

function el(tag: string, className?: string): HTMLElement {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

function fmtTime(seconds: number, showMs = false): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const base = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  if (!showMs) return base;
  const d = Math.floor((seconds % 1) * 10);
  return `${base}.${d}`;
}

function parseCoord(v: string | number): number {
  if (typeof v === 'number') return v;
  return parseFloat(v) || 0;
}

function parseTime(str: string): number | null {
  const match = str.match(/^(\d+):(\d{1,2})(?:\.(\d{1,3}))?$/);
  if (!match) return null;
  const m = parseInt(match[1], 10);
  const s = parseInt(match[2], 10);
  const ms = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
  if (s >= 60) return null;
  return m * 60 + s + ms / 1000;
}

function inlineField(label: string, value: number, onChange: (v: number) => void): HTMLElement {
  const wrap = el('div', 'point-row-field');
  const lbl = el('span', 'point-row-field-label');
  lbl.textContent = label;
  const input = el('input', 'point-row-field-input') as HTMLInputElement;
  input.type = 'number';
  input.step = '0.1';
  input.value = String(Math.round(value * 100) / 100);
  input.addEventListener('click', (e) => e.stopPropagation());
  input.addEventListener('change', () => {
    const v = parseFloat(input.value);
    if (!isNaN(v)) onChange(v);
  });
  wrap.append(lbl, input);
  return wrap;
}

function inlineTimeField(label: string, value: number, onChange: (v: number) => void): HTMLElement {
  const wrap = el('div', 'point-row-field');
  const lbl = el('span', 'point-row-field-label');
  lbl.textContent = label;
  const input = el('input', 'point-row-field-input') as HTMLInputElement;
  input.type = 'text';
  input.value = fmtTime(value, true);
  input.addEventListener('click', (e) => e.stopPropagation());
  input.addEventListener('change', () => {
    const v = parseTime(input.value);
    if (v !== null) {
      onChange(v);
    } else {
      input.value = fmtTime(value, true);
    }
  });
  wrap.append(lbl, input);
  return wrap;
}

function sidebarSelect(
  label: string,
  options: string[],
  current: string | undefined,
  defaultValue: string,
  onChange: (value: string) => void,
): HTMLElement {
  const field = el('div', 'customize-field');
  const lbl = el('span', 'customize-field-label');
  lbl.textContent = label;
  const select = el('select', 'customize-field-select') as HTMLSelectElement;
  options.forEach((opt) => {
    const option = el('option') as HTMLOptionElement;
    option.value = opt;
    option.textContent = opt;
    if ((current ?? defaultValue) === opt) option.selected = true;
    select.appendChild(option);
  });
  select.addEventListener('change', () => onChange(select.value));
  field.append(lbl, select);
  return field;
}
