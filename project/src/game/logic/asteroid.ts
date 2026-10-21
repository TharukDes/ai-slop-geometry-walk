import { range } from './mathx';
import type { PlayerBounds } from './player';

export interface AsteroidState {
  /** Centre of the circle. */
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
}

export interface AsteroidSpec {
  minRadius: number;
  maxRadius: number;
  minSpeed: number;
  maxSpeed: number;
  /** Maximum vertical drift speed, in px/s. */
  maxDrift: number;
}

/**
 * Spawn a circular asteroid just off the right edge. It drifts slowly leftward
 * with a random vertical component so it carves an unpredictable path.
 */
export function spawnAsteroid(
  rand: () => number,
  spec: AsteroidSpec,
  bounds: PlayerBounds,
): AsteroidState {
  const r = range(rand, spec.minRadius, spec.maxRadius);
  return {
    x: bounds.right + r,
    y: range(rand, bounds.top + r, bounds.bottom - r),
    r,
    vx: -range(rand, spec.minSpeed, spec.maxSpeed),
    vy: range(rand, -spec.maxDrift, spec.maxDrift),
  };
}

/**
 * Advance an asteroid, bouncing it off the top and bottom of the playfield so
 * it stays a threat for the whole trip across the screen.
 */
export function stepAsteroid(
  asteroid: AsteroidState,
  dt: number,
  bounds: PlayerBounds,
): void {
  asteroid.x += asteroid.vx * dt;
  asteroid.y += asteroid.vy * dt;

  if (asteroid.y - asteroid.r < bounds.top) {
    asteroid.y = bounds.top + asteroid.r;
    asteroid.vy = Math.abs(asteroid.vy);
  } else if (asteroid.y + asteroid.r > bounds.bottom) {
    asteroid.y = bounds.bottom - asteroid.r;
    asteroid.vy = -Math.abs(asteroid.vy);
  }
}

/** True once the asteroid has fully left the field on the left. */
export function isAsteroidGone(asteroid: AsteroidState, fieldLeft: number): boolean {
  return asteroid.x + asteroid.r < fieldLeft;
}
