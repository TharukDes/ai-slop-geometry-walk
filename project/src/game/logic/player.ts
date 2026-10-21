import { clamp } from './mathx';

export interface PlayerInput {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

export interface PlayerBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Stats that bosses/upgrades can improve over a run. */
export interface PlayerStats {
  /** Pixels per second. */
  speed: number;
  /** Seconds between shots. */
  fireInterval: number;
  /** Bullet travel speed, px/s. */
  bulletSpeed: number;
  /** Damage dealt per bullet. */
  bulletDamage: number;
  /** Number of bullets per volley (odd numbers spread symmetrically). */
  bulletCount: number;
}

export interface PlayerState extends PlayerStats {
  x: number;
  y: number;
  w: number;
  h: number;
  lives: number;
  alive: boolean;
  /** Seconds of remaining invulnerability after taking a hit. */
  invuln: number;
  /** Seconds until the next shot is fired. */
  fireCooldown: number;
}

export const BASE_STATS: PlayerStats = {
  speed: 340,
  fireInterval: 0.13,
  bulletSpeed: 780,
  bulletDamage: 1,
  bulletCount: 1,
};

export function createPlayer(
  startX: number,
  size: number,
  lives: number,
  bounds: PlayerBounds,
  stats: PlayerStats = BASE_STATS,
): PlayerState {
  return {
    ...stats,
    x: startX,
    y: bounds.top + (bounds.bottom - bounds.top - size) / 2,
    w: size,
    h: size,
    lives,
    alive: true,
    invuln: 0,
    fireCooldown: 0,
  };
}

/**
 * Advance the player by `dt` seconds using its own `speed`. Diagonal movement is
 * normalised so the player never travels faster along a diagonal than an axis.
 */
export function stepPlayer(
  state: PlayerState,
  input: PlayerInput,
  dt: number,
  bounds: PlayerBounds,
): void {
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);

  if (dx !== 0 && dy !== 0) {
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }

  state.x = clamp(state.x + dx * state.speed * dt, bounds.left, bounds.right - state.w);
  state.y = clamp(state.y + dy * state.speed * dt, bounds.top, bounds.bottom - state.h);

  if (state.invuln > 0) {
    state.invuln = Math.max(0, state.invuln - dt);
  }
  if (state.fireCooldown > 0) {
    state.fireCooldown = Math.max(0, state.fireCooldown - dt);
  }
}

/** Apply a hit to the player, returning true if it landed (i.e. not invulnerable). */
export function damagePlayer(state: PlayerState, invulnSeconds: number): boolean {
  if (!state.alive || state.invuln > 0) return false;
  state.lives -= 1;
  state.invuln = invulnSeconds;
  if (state.lives <= 0) {
    state.lives = 0;
    state.alive = false;
  }
  return true;
}
