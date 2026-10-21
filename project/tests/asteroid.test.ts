import { describe, expect, it } from 'vitest';
import {
  isAsteroidGone,
  spawnAsteroid,
  stepAsteroid,
  type AsteroidSpec,
  type AsteroidState,
} from '../src/game/logic/asteroid';
import type { PlayerBounds } from '../src/game/logic/player';

const bounds: PlayerBounds = { left: 0, right: 960, top: 0, bottom: 540 };
const spec: AsteroidSpec = {
  minRadius: 10,
  maxRadius: 20,
  minSpeed: 80,
  maxSpeed: 100,
  maxDrift: 50,
};

describe('spawnAsteroid', () => {
  it('enters from just off the right edge', () => {
    const a = spawnAsteroid(() => 0.5, spec, bounds);
    expect(a.r).toBe(15);
    expect(a.x).toBe(bounds.right + a.r);
  });

  it('keeps its radius within the spec range', () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const a = spawnAsteroid(() => t, spec, bounds);
      expect(a.r).toBeGreaterThanOrEqual(spec.minRadius);
      expect(a.r).toBeLessThanOrEqual(spec.maxRadius);
    }
  });

  it('spawns fully inside the vertical bounds', () => {
    const a = spawnAsteroid(() => 0, spec, bounds);
    expect(a.y - a.r).toBeGreaterThanOrEqual(bounds.top);
    expect(a.y + a.r).toBeLessThanOrEqual(bounds.bottom);
  });

  it('always drifts leftward', () => {
    for (const t of [0, 0.5, 1]) {
      expect(spawnAsteroid(() => t, spec, bounds).vx).toBeLessThan(0);
    }
  });
});

describe('stepAsteroid', () => {
  it('moves left by speed * dt', () => {
    const a: AsteroidState = { x: 500, y: 270, r: 15, vx: -100, vy: 0 };
    stepAsteroid(a, 0.1, bounds);
    expect(a.x).toBeCloseTo(490);
    expect(a.y).toBeCloseTo(270);
  });

  it('bounces off the top edge', () => {
    const a: AsteroidState = { x: 500, y: 12, r: 15, vx: -100, vy: -60 };
    stepAsteroid(a, 0.1, bounds);
    expect(a.y).toBe(15);
    expect(a.vy).toBeGreaterThan(0);
  });

  it('bounces off the bottom edge', () => {
    const a: AsteroidState = { x: 500, y: 530, r: 15, vx: -100, vy: 60 };
    stepAsteroid(a, 0.1, bounds);
    expect(a.y).toBe(525);
    expect(a.vy).toBeLessThan(0);
  });

  it('stays inside the field while drifting', () => {
    const a = spawnAsteroid(() => 0.9, spec, bounds);
    for (let i = 0; i < 300; i++) {
      stepAsteroid(a, 1 / 60, bounds);
      expect(a.y - a.r).toBeGreaterThanOrEqual(bounds.top - 1e-6);
      expect(a.y + a.r).toBeLessThanOrEqual(bounds.bottom + 1e-6);
    }
  });
});

describe('isAsteroidGone', () => {
  it('is false while any part is still on screen', () => {
    expect(isAsteroidGone({ x: 5, y: 100, r: 15, vx: -1, vy: 0 }, 0)).toBe(false);
  });

  it('is true once fully past the left edge', () => {
    expect(isAsteroidGone({ x: -20, y: 100, r: 15, vx: -1, vy: 0 }, 0)).toBe(true);
  });
});
