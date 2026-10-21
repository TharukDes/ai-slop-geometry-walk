import { describe, expect, it } from 'vitest';
import type { EnemyKind } from '../src/game/config';
import {
  chooseEnemyKind,
  isEnemyGone,
  spawnEnemy,
  stepEnemy,
  type EnemySpec,
} from '../src/game/logic/enemy';

const BOUNDS = { left: 0, right: 960, top: 0, bottom: 540 };

const SPEC: EnemySpec = {
  size: 26,
  minSpeed: 100,
  maxSpeed: 200,
  minWobble: 1,
  maxWobble: 1,
  minAmplitude: 0,
  maxAmplitude: 0,
  jitter: 0,
};

/** Deterministic random that walks a fixed list, then repeats the last value. */
function sequence(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)] ?? 0;
}

describe('chooseEnemyKind', () => {
  const kinds = {
    grunt: { weight: 3 },
    erratic: { weight: 1 },
  } as Record<EnemyKind, { weight: number }>;

  it('returns a kind based on the weighted roll', () => {
    expect(chooseEnemyKind(() => 0, kinds)).toBe('grunt');
    expect(chooseEnemyKind(() => 0.9, kinds)).toBe('erratic');
  });

  it('splits roughly by weight over many rolls', () => {
    let i = 0;
    const rand = () => i++ / 1000;
    let erratic = 0;
    for (let n = 0; n < 1000; n++) {
      if (chooseEnemyKind(rand, kinds) === 'erratic') erratic += 1;
    }
    // erratic carries weight 1 of 4 -> about a quarter.
    expect(erratic).toBeGreaterThan(200);
    expect(erratic).toBeLessThan(300);
  });

  it('falls back to grunt when no kind has weight', () => {
    const empty = { grunt: { weight: 0 }, erratic: { weight: 0 } } as Record<
      EnemyKind,
      { weight: number }
    >;
    expect(chooseEnemyKind(() => 0.5, empty)).toBe('grunt');
  });
});

describe('spawnEnemy', () => {
  it('spawns at the right edge inside the vertical bounds and records its kind', () => {
    const enemy = spawnEnemy(sequence([0.5, 0.5, 0.5, 0.5]), 'erratic', SPEC, BOUNDS);
    expect(enemy.kind).toBe('erratic');
    expect(enemy.x).toBe(BOUNDS.right);
    expect(enemy.y).toBeGreaterThanOrEqual(BOUNDS.top);
    expect(enemy.y).toBeLessThanOrEqual(BOUNDS.bottom - SPEC.size);
    expect(enemy.vx).toBeLessThan(0);
  });
});

describe('stepEnemy', () => {
  it('moves left at its velocity when there is no jitter', () => {
    const enemy = spawnEnemy(() => 0, 'grunt', SPEC, BOUNDS);
    const startX = enemy.x;
    stepEnemy(enemy, 0.5, BOUNDS);
    expect(enemy.x).toBeCloseTo(startX + enemy.vx * 0.5);
    expect(enemy.x).toBeLessThan(startX);
  });

  it('perturbs horizontal motion when jitter is present', () => {
    const jittered: EnemySpec = { ...SPEC, jitter: 150 };
    const enemy = spawnEnemy(sequence([0.5, 0.25, 0.5, 0.5]), 'erratic', jittered, BOUNDS);
    const startX = enemy.x;
    stepEnemy(enemy, 0.1, BOUNDS);
    // With a non-zero phase the jitter term shifts x away from a pure vx step.
    expect(enemy.x).not.toBeCloseTo(startX + enemy.vx * 0.1, 5);
  });

  it('oscillates around its base height within the amplitude', () => {
    const spec: EnemySpec = { ...SPEC, minAmplitude: 20, maxAmplitude: 20, minWobble: 1, maxWobble: 1 };
    const enemy = spawnEnemy(() => 0.5, 'grunt', spec, BOUNDS);
    const base = enemy.baseY;
    // Compound wobble peaks at amplitude * (1 + 0.35).
    const peak = 20 * 1.35 + 1e-6;
    for (let i = 0; i < 120; i++) {
      stepEnemy(enemy, 1 / 60, BOUNDS);
      expect(Math.abs(enemy.y - base)).toBeLessThanOrEqual(peak);
    }
  });

  it('stays clamped within the playfield even with a large amplitude', () => {
    const spec: EnemySpec = { ...SPEC, minAmplitude: 1000, maxAmplitude: 1000, minWobble: 1, maxWobble: 1 };
    const enemy = spawnEnemy(() => 0, 'erratic', spec, BOUNDS);
    for (let i = 0; i < 240; i++) {
      stepEnemy(enemy, 1 / 60, BOUNDS);
      expect(enemy.y).toBeGreaterThanOrEqual(BOUNDS.top);
      expect(enemy.y).toBeLessThanOrEqual(BOUNDS.bottom - enemy.h);
    }
  });
});

describe('isEnemyGone', () => {
  it('reports gone only after clearing the left edge', () => {
    const enemy = spawnEnemy(() => 0.5, 'grunt', SPEC, BOUNDS);
    enemy.x = 10;
    expect(isEnemyGone(enemy, BOUNDS.left)).toBe(false);
    enemy.x = -enemy.w - 1;
    expect(isEnemyGone(enemy, BOUNDS.left)).toBe(true);
  });
});

const SPINNER: EnemySpec = { ...SPEC, spinMin: 2, spinMax: 2 };

describe('spin', () => {
  it('assigns a spin magnitude and a random starting angle', () => {
    const enemy = spawnEnemy(() => 0.5, 'grunt', SPINNER, BOUNDS);
    // sign roll is 0.5 -> positive, magnitude is the fixed 2.
    expect(enemy.spin).toBe(2);
    expect(enemy.angle).toBeGreaterThanOrEqual(0);
    expect(enemy.angle).toBeLessThan(Math.PI * 2);
  });

  it('can spin the other way', () => {
    const enemy = spawnEnemy(sequence([0.5, 0.5, 0.5, 0.5, 0.1]), 'grunt', SPINNER, BOUNDS);
    expect(enemy.spin).toBe(-2);
  });

  it('defaults to no spin when the spec omits it', () => {
    expect(spawnEnemy(() => 0.5, 'grunt', SPEC, BOUNDS).spin).toBe(0);
  });

  it('advances the angle by spin * dt', () => {
    const enemy = spawnEnemy(() => 0.5, 'grunt', SPINNER, BOUNDS);
    enemy.angle = 0;
    enemy.spin = 1;
    stepEnemy(enemy, 0.5, BOUNDS);
    expect(enemy.angle).toBeCloseTo(0.5);
  });

  it('keeps the angle wrapped within one turn', () => {
    const enemy = spawnEnemy(() => 0.5, 'grunt', SPINNER, BOUNDS);
    for (let i = 0; i < 500; i++) {
      stepEnemy(enemy, 1 / 60, BOUNDS);
      expect(enemy.angle).toBeGreaterThanOrEqual(0);
      expect(enemy.angle).toBeLessThan(Math.PI * 2);
    }
  });
});

const HUNTER: EnemySpec = {
  ...SPEC,
  size: 30,
  minSpeed: 60,
  maxSpeed: 100,
  homing: 100,
  sideOffset: 18,
};

describe('hunter homing', () => {
  it('assigns a flank side and a matching signed offset', () => {
    const below = spawnEnemy(sequence([0.5, 0.5, 0.9, 0.5, 0.5]), 'hunter', HUNTER, BOUNDS);
    expect(below.side).toBe(1);
    expect(below.targetOffset).toBe(18);
    expect(below.homing).toBe(100);

    const above = spawnEnemy(sequence([0.5, 0.5, 0.1, 0.5, 0.5]), 'hunter', HUNTER, BOUNDS);
    expect(above.side).toBe(-1);
    expect(above.targetOffset).toBe(-18);
  });

  it('steers toward the target flank at the capped homing speed', () => {
    const enemy = spawnEnemy(() => 0.5, 'hunter', HUNTER, BOUNDS);
    enemy.x = 500;
    enemy.y = 100;
    // Aim for the player's centre (y = 300) with the +18 flank offset, so the
    // enemy's top-left target is 300 + 18 - 15 = 303.
    stepEnemy(enemy, 0.1, BOUNDS, 300);
    expect(enemy.y).toBeCloseTo(100 + HUNTER.homing! * 0.1);
  });

  it('converges on the player flank over time', () => {
    const enemy = spawnEnemy(() => 0.5, 'hunter', HUNTER, BOUNDS);
    const target = 250;
    for (let i = 0; i < 240; i++) {
      stepEnemy(enemy, 1 / 60, BOUNDS, target);
    }
    const enemyCentre = enemy.y + enemy.h / 2;
    expect(Math.abs(enemyCentre - (target + enemy.targetOffset))).toBeLessThan(1);
  });

  it('tracks a moving target', () => {
    const enemy = spawnEnemy(() => 0.5, 'hunter', HUNTER, BOUNDS);
    let target = 100;
    for (let i = 0; i < 300; i++) {
      target = 100 + Math.sin(i / 30) * 150;
      stepEnemy(enemy, 1 / 60, BOUNDS, target);
      expect(enemy.y).toBeGreaterThanOrEqual(BOUNDS.top);
      expect(enemy.y).toBeLessThanOrEqual(BOUNDS.bottom - enemy.h);
    }
  });

  it('stays clamped to the playfield when the target is off-screen', () => {
    const enemy = spawnEnemy(() => 0, 'hunter', HUNTER, BOUNDS);
    for (let i = 0; i < 300; i++) {
      stepEnemy(enemy, 1 / 60, BOUNDS, -500);
    }
    expect(enemy.y).toBe(BOUNDS.top);
  });

  it('holds altitude without wobbling when no target is supplied', () => {
    const enemy = spawnEnemy(() => 0.5, 'hunter', HUNTER, BOUNDS);
    const startY = enemy.y;
    stepEnemy(enemy, 1 / 30, BOUNDS);
    expect(enemy.y).toBeCloseTo(startY);
  });
});
