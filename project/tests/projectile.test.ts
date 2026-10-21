import { describe, expect, it } from 'vitest';
import {
  aimedVolley,
  isProjectileSpent,
  stepProjectile,
  type ProjectileState,
  type VolleySpec,
} from '../src/game/logic/projectile';
import type { PlayerBounds } from '../src/game/logic/player';

const BOUNDS: PlayerBounds = { left: 0, right: 960, top: 0, bottom: 540 };
const SPEC: VolleySpec = { size: 12, speed: 300, life: 4, count: 1, spreadRadians: 0 };

describe('aimedVolley', () => {
  it('aims a single projectile straight at the target', () => {
    const [p] = aimedVolley({ x: 0, y: 0 }, { x: 100, y: 0 }, SPEC);
    expect(p!.vx).toBeCloseTo(300);
    expect(p!.vy).toBeCloseTo(0);
  });

  it('aims downward when the target is below', () => {
    const [p] = aimedVolley({ x: 0, y: 0 }, { x: 0, y: 100 }, { ...SPEC, speed: 100 });
    expect(p!.vy).toBeCloseTo(100);
    expect(p!.vx).toBeCloseTo(0);
  });

  it('fans a burst symmetrically around the aim line', () => {
    const volley = aimedVolley({ x: 0, y: 0 }, { x: 100, y: 0 }, {
      ...SPEC,
      count: 3,
      spreadRadians: 0.6,
    });
    expect(volley).toHaveLength(3);
    const [up, middle, down] = volley;
    expect(middle!.vy).toBeCloseTo(0);
    expect(up!.vy).toBeLessThan(0);
    expect(down!.vy).toBeGreaterThan(0);
    expect(up!.vy).toBeCloseTo(-down!.vy);
  });

  it('keeps projectile speed constant across the fan', () => {
    const volley = aimedVolley({ x: 0, y: 0 }, { x: 50, y: 50 }, {
      ...SPEC,
      count: 5,
      spreadRadians: 1,
    });
    for (const p of volley) {
      expect(Math.hypot(p.vx, p.vy)).toBeCloseTo(SPEC.speed);
    }
  });

  it('centres the square on the origin', () => {
    const [p] = aimedVolley({ x: 100, y: 200 }, { x: 500, y: 200 }, SPEC);
    expect(p!.x).toBe(100 - SPEC.size / 2);
    expect(p!.y).toBe(200 - SPEC.size / 2);
    expect(p!.w).toBe(SPEC.size);
  });
});

describe('stepProjectile', () => {
  it('moves along its velocity and burns lifetime', () => {
    const [p] = aimedVolley({ x: 0, y: 0 }, { x: 100, y: 0 }, SPEC);
    const startX = p!.x;
    stepProjectile(p!, 0.5);
    expect(p!.x).toBeCloseTo(startX + 150);
    expect(p!.life).toBeCloseTo(3.5);
  });
});

describe('isProjectileSpent', () => {
  const base: ProjectileState = { x: 100, y: 100, w: 12, h: 12, vx: 0, vy: 0, life: 1 };

  it('is not spent while alive and on screen', () => {
    expect(isProjectileSpent(base, BOUNDS)).toBe(false);
  });

  it('is spent when out of life', () => {
    expect(isProjectileSpent({ ...base, life: 0 }, BOUNDS)).toBe(true);
  });

  it('is spent once it leaves any edge', () => {
    expect(isProjectileSpent({ ...base, x: -20 }, BOUNDS)).toBe(true);
    expect(isProjectileSpent({ ...base, x: 1000 }, BOUNDS)).toBe(true);
    expect(isProjectileSpent({ ...base, y: -20 }, BOUNDS)).toBe(true);
    expect(isProjectileSpent({ ...base, y: 600 }, BOUNDS)).toBe(true);
  });
});
