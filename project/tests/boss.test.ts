import { describe, expect, it } from 'vitest';
import {
  damageBoss,
  isBossDead,
  spawnBoss,
  stepBoss,
  tickBossAttack,
  type BossSpec,
} from '../src/game/logic/boss';
import type { PlayerBounds } from '../src/game/logic/player';

const BOUNDS: PlayerBounds = { left: 0, right: 960, top: 0, bottom: 540 };

const SPEC: BossSpec = {
  size: 120,
  hoverMargin: 60,
  approachSpeed: 240,
  minAmplitude: 100,
  maxAmplitude: 100,
  minWobble: 1,
  maxWobble: 1,
  spin: 1.2,
  baseHp: 80,
  hpPerBoss: 45,
  baseFireInterval: 2,
  fireIntervalPerBoss: 0.5,
  minFireInterval: 0.5,
  baseVolley: 1,
  volleyPerBoss: 2,
  maxVolley: 5,
  baseProjectileSpeed: 200,
  projectileSpeedPerBoss: 50,
  maxProjectileSpeed: 400,
  baseSpread: 0.2,
  spreadPerBoss: 0.2,
  maxSpread: 1.0,
};

describe('spawnBoss', () => {
  it('scales HP with the boss number', () => {
    expect(spawnBoss(() => 0.5, SPEC, BOUNDS, 0).hp).toBe(80);
    expect(spawnBoss(() => 0.5, SPEC, BOUNDS, 1).hp).toBe(125);
    expect(spawnBoss(() => 0.5, SPEC, BOUNDS, 2).hp).toBe(170);
  });

  it('starts at max HP and enters from the right', () => {
    const boss = spawnBoss(() => 0.5, SPEC, BOUNDS, 0);
    expect(boss.maxHp).toBe(boss.hp);
    expect(boss.x).toBe(BOUNDS.right);
    expect(boss.entering).toBe(true);
  });

  it('computes a hover position inside the right edge', () => {
    const boss = spawnBoss(() => 0.5, SPEC, BOUNDS, 0);
    expect(boss.hoverX).toBe(BOUNDS.right - SPEC.hoverMargin - SPEC.size);
  });
});

describe('boss difficulty scaling', () => {
  it('attacks faster, more, and harder each time', () => {
    const first = spawnBoss(() => 0.5, SPEC, BOUNDS, 0);
    const second = spawnBoss(() => 0.5, SPEC, BOUNDS, 1);

    expect(first.fireInterval).toBe(2);
    expect(second.fireInterval).toBe(1.5);
    expect(second.volley).toBeGreaterThan(first.volley);
    expect(second.projectileSpeed).toBeGreaterThan(first.projectileSpeed);
    expect(second.spread).toBeGreaterThan(first.spread);
  });

  it('clamps every attack parameter', () => {
    const boss = spawnBoss(() => 0.5, SPEC, BOUNDS, 40);
    expect(boss.fireInterval).toBe(SPEC.minFireInterval);
    expect(boss.volley).toBe(SPEC.maxVolley);
    expect(boss.projectileSpeed).toBe(SPEC.maxProjectileSpeed);
    expect(boss.spread).toBe(SPEC.maxSpread);
  });

  it('is monotonic in boss number', () => {
    let prevFire = Infinity;
    let prevVolley = -Infinity;
    let prevSpeed = -Infinity;
    for (let n = 0; n < 10; n++) {
      const boss = spawnBoss(() => 0.5, SPEC, BOUNDS, n);
      expect(boss.fireInterval).toBeLessThanOrEqual(prevFire);
      expect(boss.volley).toBeGreaterThanOrEqual(prevVolley);
      expect(boss.projectileSpeed).toBeGreaterThanOrEqual(prevSpeed);
      prevFire = boss.fireInterval;
      prevVolley = boss.volley;
      prevSpeed = boss.projectileSpeed;
    }
  });
});

describe('stepBoss', () => {
  it('flies in and then settles at its hover position', () => {
    const boss = spawnBoss(() => 0.5, SPEC, BOUNDS, 0);
    for (let i = 0; i < 600 && boss.entering; i++) {
      stepBoss(boss, 1 / 60, BOUNDS);
    }
    expect(boss.entering).toBe(false);
    expect(boss.x).toBe(boss.hoverX);
  });

  it('oscillates vertically once settled, staying in bounds', () => {
    const boss = spawnBoss(() => 0.5, SPEC, BOUNDS, 0);
    while (boss.entering) stepBoss(boss, 1 / 60, BOUNDS);

    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < 600; i++) {
      stepBoss(boss, 1 / 60, BOUNDS);
      minY = Math.min(minY, boss.y);
      maxY = Math.max(maxY, boss.y);
      expect(boss.y).toBeGreaterThanOrEqual(BOUNDS.top);
      expect(boss.y).toBeLessThanOrEqual(BOUNDS.bottom - boss.h);
    }
    expect(maxY - minY).toBeGreaterThan(50);
  });

  it('spins while it moves', () => {
    const boss = spawnBoss(() => 0.5, SPEC, BOUNDS, 0);
    boss.angle = 0;
    stepBoss(boss, 0.5, BOUNDS);
    expect(boss.angle).toBeCloseTo(SPEC.spin * 0.5);
  });
});

describe('tickBossAttack', () => {
  it('holds fire while the boss is still flying in', () => {
    const boss = spawnBoss(() => 0.5, SPEC, BOUNDS, 0);
    expect(boss.entering).toBe(true);
    expect(tickBossAttack(boss, 5)).toBe(false);
    expect(boss.fireCooldown).toBe(boss.fireInterval);
  });

  it('fires once the cooldown elapses and reschedules', () => {
    const boss = spawnBoss(() => 0.5, SPEC, BOUNDS, 0);
    boss.entering = false;
    boss.fireInterval = 1;
    boss.fireCooldown = 0.1;

    expect(tickBossAttack(boss, 0.05)).toBe(false);
    expect(boss.fireCooldown).toBeCloseTo(0.05);

    expect(tickBossAttack(boss, 0.06)).toBe(true);
    // Wrapped around by the interval.
    expect(boss.fireCooldown).toBeCloseTo(0.05 - 0.06 + 1);
  });
});

describe('damage and death', () => {
  it('reduces HP without going negative', () => {
    const boss = spawnBoss(() => 0.5, SPEC, BOUNDS, 0);
    damageBoss(boss, 30);
    expect(boss.hp).toBe(50);
    damageBoss(boss, 999);
    expect(boss.hp).toBe(0);
  });

  it('reports death at zero HP', () => {
    const boss = spawnBoss(() => 0.5, SPEC, BOUNDS, 0);
    expect(isBossDead(boss)).toBe(false);
    damageBoss(boss, boss.maxHp);
    expect(isBossDead(boss)).toBe(true);
  });
});
