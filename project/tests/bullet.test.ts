import { describe, expect, it } from 'vitest';
import {
  fireBullet,
  fireVolley,
  isBulletSpent,
  stepBullet,
  type BulletSpec,
} from '../src/game/logic/bullet';
import { overlaps } from '../src/game/logic/mathx';

const SPEC: BulletSpec = {
  width: 16,
  height: 6,
  speed: 800,
  life: 1,
  muzzleOffset: 30,
};

const PLAYER = { x: 100, y: 200, w: 26, h: 26 };

describe('fireBullet', () => {
  it('spawns ahead of the player and vertically centred', () => {
    const bullet = fireBullet(PLAYER, SPEC);
    expect(bullet.x).toBe(PLAYER.x + PLAYER.w + SPEC.muzzleOffset);
    expect(bullet.y).toBe(PLAYER.y + PLAYER.h / 2 - SPEC.height / 2);
    expect(bullet.vx).toBe(SPEC.speed);
    expect(bullet.life).toBe(SPEC.life);
  });

  it('produces a box that overlaps an enemy sitting in its path', () => {
    const bullet = fireBullet(PLAYER, SPEC);
    // Enemy sitting in the bullet's box (bullet is 16px wide).
    const tip = { x: bullet.x + 10, y: bullet.y, w: 26, h: 26 };
    expect(overlaps(bullet, tip)).toBe(true);

    // And one still far down-range is not yet hit.
    const ahead = { x: bullet.x + 80, y: bullet.y, w: 26, h: 26 };
    expect(overlaps(bullet, ahead)).toBe(false);

    // After stepping forward it reaches the distant enemy.
    stepBullet(bullet, 0.1);
    expect(overlaps(bullet, ahead)).toBe(true);
  });
});

describe('fireVolley', () => {
  it('fires a single straight bullet by default', () => {
    const [bullet] = fireVolley(PLAYER, SPEC);
    expect(bullet!.vy).toBeCloseTo(0);
    expect(bullet!.vx).toBeCloseTo(SPEC.speed);
  });

  it('fans multiple bullets symmetrically across the spread', () => {
    const volley = fireVolley(PLAYER, { ...SPEC, count: 3, spreadRadians: 0.4 });
    expect(volley).toHaveLength(3);

    const [left, middle, right] = volley;
    expect(middle!.vy).toBeCloseTo(0);
    expect(left!.vy).toBeLessThan(0);
    expect(right!.vy).toBeGreaterThan(0);
    expect(left!.vy).toBeCloseTo(-right!.vy);
  });

  it('keeps the muzzle speed constant regardless of angle', () => {
    const volley = fireVolley(PLAYER, { ...SPEC, count: 5, spreadRadians: 0.6 });
    for (const bullet of volley) {
      expect(Math.hypot(bullet.vx, bullet.vy)).toBeCloseTo(SPEC.speed);
    }
  });

  it('carries the requested damage', () => {
    const [bullet] = fireVolley(PLAYER, { ...SPEC, damage: 3 });
    expect(bullet!.damage).toBe(3);
  });
});

describe('stepBullet', () => {
  it('travels right and burns lifetime', () => {
    const bullet = fireBullet(PLAYER, SPEC);
    const startX = bullet.x;
    stepBullet(bullet, 0.25);
    expect(bullet.x).toBeCloseTo(startX + SPEC.speed * 0.25);
    expect(bullet.life).toBeCloseTo(0.75);
  });
});

describe('isBulletSpent', () => {
  it('is spent once past the right edge or out of life', () => {
    const bullet = fireBullet(PLAYER, SPEC);
    expect(isBulletSpent(bullet, 960)).toBe(false);
    bullet.x = 1000;
    expect(isBulletSpent(bullet, 960)).toBe(true);

    const timedOut = fireBullet(PLAYER, SPEC);
    timedOut.life = 0;
    expect(isBulletSpent(timedOut, 960)).toBe(true);
  });
});
