import { describe, expect, it } from 'vitest';
import {
  BASE_STATS,
  createPlayer,
  damagePlayer,
  stepPlayer,
  type PlayerInput,
  type PlayerState,
} from '../src/game/logic/player';

const BOUNDS = { left: 0, right: 960, top: 0, bottom: 540 };
const SPEED = 300;

function input(overrides: Partial<PlayerInput> = {}): PlayerInput {
  return { left: false, right: false, up: false, down: false, ...overrides };
}

function fresh(): PlayerState {
  const player = createPlayer(100, 20, 3, BOUNDS);
  player.speed = SPEED;
  return player;
}

describe('createPlayer', () => {
  it('centres the player vertically and starts healthy', () => {
    const player = fresh();
    expect(player.x).toBe(100);
    expect(player.y).toBe((540 - 20) / 2);
    expect(player.lives).toBe(3);
    expect(player.alive).toBe(true);
  });

  it('applies the supplied stats', () => {
    const player = createPlayer(0, 20, 1, BOUNDS, {
      speed: 111,
      fireInterval: 0.2,
      bulletSpeed: 500,
      bulletDamage: 3,
      bulletCount: 5,
    });
    expect(player.speed).toBe(111);
    expect(player.bulletDamage).toBe(3);
    expect(player.bulletCount).toBe(5);
  });

  it('defaults to the base stats', () => {
    const player = createPlayer(0, 20, 1, BOUNDS);
    expect(player.speed).toBe(BASE_STATS.speed);
    expect(player.bulletCount).toBe(BASE_STATS.bulletCount);
  });
});

describe('stepPlayer', () => {
  it('moves right and left along the x axis', () => {
    const right = fresh();
    stepPlayer(right, input({ right: true }), 0.1, BOUNDS);
    expect(right.x).toBeCloseTo(100 + 30);

    const left = fresh();
    stepPlayer(left, input({ left: true }), 0.1, BOUNDS);
    expect(left.x).toBeCloseTo(70);
  });

  it('moves up and down along the y axis', () => {
    const up = fresh();
    const start = up.y;
    stepPlayer(up, input({ up: true }), 0.1, BOUNDS);
    expect(up.y).toBeCloseTo(start - 30);
  });

  it('normalises diagonal movement so it is not faster', () => {
    const player = fresh();
    const startX = player.x;
    const startY = player.y;
    stepPlayer(player, input({ right: true, down: true }), 0.1, BOUNDS);
    const distance = Math.hypot(player.x - startX, player.y - startY);
    expect(distance).toBeCloseTo(30);
  });

  it('uses the player\'s own speed stat', () => {
    const player = fresh();
    player.speed = 600;
    stepPlayer(player, input({ right: true }), 0.1, BOUNDS);
    expect(player.x).toBeCloseTo(100 + 60);
  });

  it('clamps to the playfield on every edge', () => {
    const player = fresh();
    stepPlayer(player, input({ left: true, up: true }), 10, BOUNDS);
    expect(player.x).toBe(BOUNDS.left);
    expect(player.y).toBe(BOUNDS.top);

    stepPlayer(player, input({ right: true, down: true }), 10, BOUNDS);
    expect(player.x).toBe(BOUNDS.right - player.w);
    expect(player.y).toBe(BOUNDS.bottom - player.h);
  });

  it('counts invulnerability and fire cooldowns down', () => {
    const player = fresh();
    player.invuln = 1;
    player.fireCooldown = 0.5;
    stepPlayer(player, input(), 0.3, BOUNDS);
    expect(player.invuln).toBeCloseTo(0.7);
    expect(player.fireCooldown).toBeCloseTo(0.2);
  });
});

describe('damagePlayer', () => {
  it('costs a life and grants temporary invulnerability', () => {
    const player = fresh();
    expect(damagePlayer(player, 1.5)).toBe(true);
    expect(player.lives).toBe(2);
    expect(player.invuln).toBe(1.5);
  });

  it('ignores hits while invulnerable', () => {
    const player = fresh();
    damagePlayer(player, 1.5);
    expect(damagePlayer(player, 1.5)).toBe(false);
    expect(player.lives).toBe(2);
  });

  it('ends the run at zero lives', () => {
    const player = fresh();
    player.lives = 1;
    player.invuln = 0;
    damagePlayer(player, 1.5);
    expect(player.lives).toBe(0);
    expect(player.alive).toBe(false);
  });
});
