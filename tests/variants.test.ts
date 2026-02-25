import { describe, it, expect, vi } from 'vitest';
import { createVariants } from '../src/popover/components/variants';
import type { ProductVariant } from '../src/core/types';

describe('createVariants', () => {
  const sizeVariants: ProductVariant[] = [
    { id: 's', type: 'size', label: 'S', available: true },
    { id: 'm', type: 'size', label: 'M', available: true, selected: true },
    { id: 'l', type: 'size', label: 'L', available: true },
    { id: 'xl', type: 'size', label: 'XL', available: false },
  ];

  const colorVariants: ProductVariant[] = [
    { id: 'red', type: 'color', label: 'Red', color: '#ff0000' },
    { id: 'blue', type: 'color', label: 'Blue', color: '#0000ff', selected: true },
  ];

  it('returns null for undefined variants', () => {
    expect(createVariants(undefined, 'h1', null, undefined, [])).toBeNull();
  });

  it('returns null for empty variants', () => {
    expect(createVariants([], 'h1', null, undefined, [])).toBeNull();
  });

  it('renders size pills', () => {
    const cleanups: (() => void)[] = [];
    const result = createVariants(sizeVariants, 'h1', null, undefined, cleanups);
    expect(result).not.toBeNull();

    const pills = result!.element.querySelectorAll('.ci-video-hotspot-variant-pill');
    expect(pills.length).toBe(4);
  });

  it('renders color swatches', () => {
    const cleanups: (() => void)[] = [];
    const result = createVariants(colorVariants, 'h1', null, undefined, cleanups);

    const swatches = result!.element.querySelectorAll('.ci-video-hotspot-variant-swatch');
    expect(swatches.length).toBe(2);
  });

  it('marks selected variant', () => {
    const cleanups: (() => void)[] = [];
    const result = createVariants(sizeVariants, 'h1', null, undefined, cleanups);

    const selected = result!.element.querySelectorAll('.ci-video-hotspot-variant--selected');
    expect(selected.length).toBe(1);
    expect(selected[0].textContent).toBe('M');
  });

  it('marks disabled variant', () => {
    const cleanups: (() => void)[] = [];
    const result = createVariants(sizeVariants, 'h1', null, undefined, cleanups);

    const disabled = result!.element.querySelectorAll('.ci-video-hotspot-variant--disabled');
    expect(disabled.length).toBe(1);
    expect((disabled[0] as HTMLButtonElement).disabled).toBe(true);
  });

  it('clicking a pill selects it and deselects others', () => {
    const cleanups: (() => void)[] = [];
    const result = createVariants(sizeVariants, 'h1', null, undefined, cleanups);

    const pills = result!.element.querySelectorAll('.ci-video-hotspot-variant-pill');
    // Click 'S' (index 0)
    (pills[0] as HTMLElement).click();

    expect(pills[0].classList.contains('ci-video-hotspot-variant--selected')).toBe(true);
    expect(pills[1].classList.contains('ci-video-hotspot-variant--selected')).toBe(false);
    expect(pills[0].getAttribute('aria-checked')).toBe('true');
    expect(pills[1].getAttribute('aria-checked')).toBe('false');
  });

  it('calls onSelect callback', () => {
    const onSelect = vi.fn();
    const cleanups: (() => void)[] = [];
    const result = createVariants(sizeVariants, 'h1', null, onSelect, cleanups);

    const pills = result!.element.querySelectorAll('.ci-video-hotspot-variant-pill');
    (pills[2] as HTMLElement).click();

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].id).toBe('l');
    expect(onSelect.mock.calls[0][2]).toBe('h1');
  });

  it('updates price element when variant has price', () => {
    const variants: ProductVariant[] = [
      { id: 'a', type: 'size', label: 'S', price: '$29' },
      { id: 'b', type: 'size', label: 'L', price: '$39' },
    ];
    const priceEl = document.createElement('span');
    priceEl.textContent = '$29';

    const cleanups: (() => void)[] = [];
    const result = createVariants(variants, 'h1', priceEl, undefined, cleanups);

    const pills = result!.element.querySelectorAll('.ci-video-hotspot-variant-pill');
    (pills[1] as HTMLElement).click();

    expect(priceEl.textContent).toBe('$39');
  });

  it('getSelected returns currently selected variants', () => {
    const cleanups: (() => void)[] = [];
    const allVariants = [...sizeVariants, ...colorVariants];
    const result = createVariants(allVariants, 'h1', null, undefined, cleanups);

    const selected = result!.getSelected();
    expect(selected.length).toBe(2);
    expect(selected.find((v) => v.type === 'size')?.id).toBe('m');
    expect(selected.find((v) => v.type === 'color')?.id).toBe('blue');
  });

  it('uses role=radiogroup with aria-label', () => {
    const cleanups: (() => void)[] = [];
    const result = createVariants(sizeVariants, 'h1', null, undefined, cleanups);

    const group = result!.element.querySelector('[role="radiogroup"]');
    expect(group).not.toBeNull();
    expect(group!.getAttribute('aria-label')).toBe('size');
  });

  it('pushes cleanups for each button', () => {
    const cleanups: (() => void)[] = [];
    createVariants(sizeVariants, 'h1', null, undefined, cleanups);
    expect(cleanups.length).toBe(sizeVariants.length);
  });
});
