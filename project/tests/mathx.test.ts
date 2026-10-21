import { describe, expect, it } from 'vitest';
import { clamp, overlaps, range } from '../src/game/logic/mathx';

describe('clamp', () => {
  it('leaves values inside the range untouched', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps below and above', () => {
    expect(clamp(-4, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });
});

describe('overlaps', () => {
  const a = { x: 0, y: 0, w: 10, h: 10 };

  it('detects a clear overlap', () => {
    expect(overlaps(a, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
  });

  it('rejects separated boxes', () => {
    expect(overlaps(a, { x: 20, y: 0, w: 5, h: 5 })).toBe(false);
    expect(overlaps(a, { x: 0, y: 20, w: 5, h: 5 })).toBe(false);
  });

  it('treats touching edges as not overlapping', () => {
    expect(overlaps(a, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
    expect(overlaps(a, { x: -10, y: 0, w: 10, h: 10 })).toBe(false);
  });

  it('is symmetric', () => {
    const b = { x: 3, y: -3, w: 4, h: 20 };
    expect(overlaps(a, b)).toBe(overlaps(b, a));
  });
});

describe('range', () => {
  it('maps the unit random onto the interval', () => {
    expect(range(() => 0, 2, 6)).toBe(2);
    expect(range(() => 0.5, 2, 6)).toBe(4);
    expect(range(() => 1, 2, 6)).toBe(6);
  });
});
