import { describe, expect, it } from 'vitest';
import { createPlayer, type PlayerState } from '../src/game/logic/player';
import {
  nextUpgrade,
  upgradesFor,
  type UpgradeCaps,
} from '../src/game/logic/upgrades';

const BOUNDS = { left: 0, right: 960, top: 0, bottom: 540 };

const CAPS: UpgradeCaps = {
  fireIntervalFactor: 0.8,
  minFireInterval: 0.05,
  speedStep: 50,
  maxSpeed: 500,
  spreadStep: 2,
  maxBulletCount: 5,
  damageStep: 1,
  maxDamage: 3,
};

const list = upgradesFor(CAPS);

function fresh(): PlayerState {
  return createPlayer(0, 20, 3, BOUNDS);
}

function byId(id: string) {
  const upgrade = list.find((u) => u.id === id);
  if (!upgrade) throw new Error(`missing upgrade ${id}`);
  return upgrade;
}

describe('upgrade pool', () => {
  it('cycles through the pool in order', () => {
    expect(nextUpgrade(0, list).id).toBe(list[0]!.id);
    expect(nextUpgrade(1, list).id).toBe(list[1]!.id);
    expect(nextUpgrade(list.length, list).id).toBe(list[0]!.id);
    expect(nextUpgrade(list.length + 2, list).id).toBe(list[2]!.id);
  });
});

describe('upgrade effects', () => {
  it('rapid fire shortens the interval by the factor', () => {
    const player = fresh();
    const before = player.fireInterval;
    byId('rapid').apply(player);
    expect(player.fireInterval).toBeCloseTo(before * CAPS.fireIntervalFactor);
  });

  it('rapid fire respects its floor', () => {
    const player = fresh();
    player.fireInterval = CAPS.minFireInterval;
    byId('rapid').apply(player);
    expect(player.fireInterval).toBe(CAPS.minFireInterval);
  });

  it('spread shot adds bullets, up to the cap', () => {
    const player = fresh();
    byId('spread').apply(player);
    expect(player.bulletCount).toBe(3);
    byId('spread').apply(player);
    expect(player.bulletCount).toBe(5);
    byId('spread').apply(player);
    expect(player.bulletCount).toBe(CAPS.maxBulletCount);
  });

  it('engine boost raises speed, up to the cap', () => {
    const player = fresh();
    byId('engine').apply(player);
    expect(player.speed).toBe(390);
    player.speed = CAPS.maxSpeed;
    byId('engine').apply(player);
    expect(player.speed).toBe(CAPS.maxSpeed);
  });

  it('reinforce grants an extra life', () => {
    const player = fresh();
    byId('life').apply(player);
    expect(player.lives).toBe(4);
  });

  it('power shot raises damage, up to the cap', () => {
    const player = fresh();
    byId('power').apply(player);
    expect(player.bulletDamage).toBe(2);
    player.bulletDamage = CAPS.maxDamage;
    byId('power').apply(player);
    expect(player.bulletDamage).toBe(CAPS.maxDamage);
  });
});
