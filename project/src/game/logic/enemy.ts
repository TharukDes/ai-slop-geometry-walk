import type { EnemyKind, EnemyKindSpec } from '../config';
import { clamp, range, type Box } from './mathx';
import type { PlayerBounds } from './player';

export interface EnemyState extends Box {
  kind: EnemyKind;
  /** Base horizontal velocity, negative because enemies travel leftward. */
  vx: number;
  /** Amplitude of the horizontal jitter, in px/s. */
  jitter: number;
  /** Max vertical steering speed in px/s; 0 for non-homing kinds. */
  homing: number;
  /** Which flank a hunter converges on: -1 above the player, +1 below. */
  side: -1 | 1;
  /** Signed vertical offset from the player's centre that a hunter aims for. */
  targetOffset: number;
  /** Vertical centre the wobble oscillates around. */
  baseY: number;
  phase: number;
  amplitude: number;
  /** Radians/second the wobble advances. */
  wobble: number;
  /** Current rotation of the triangle, in radians. */
  angle: number;
  /** Radians/second the triangle spins (signed). */
  spin: number;
}

export type EnemySpec = Omit<EnemyKindSpec, 'score' | 'weight' | 'color' | 'fill'>;

/**
 * Pick an enemy archetype using the relative `weight` of each kind.
 * Deterministic for a given `rand`, which keeps it easy to test.
 */
export function chooseEnemyKind(
  rand: () => number,
  kinds: Record<EnemyKind, { weight: number }>,
): EnemyKind {
  const entries = Object.entries(kinds) as [EnemyKind, { weight: number }][];
  const total = entries.reduce((sum, [, spec]) => sum + spec.weight, 0);
  if (total <= 0) return 'grunt';

  let roll = rand() * total;
  let last: EnemyKind = 'grunt';
  for (const [kind, spec] of entries) {
    last = kind;
    roll -= spec.weight;
    if (roll < 0) return kind;
  }
  return last;
}

/** Spawn an enemy just past the right edge of the playfield, at a random height. */
export function spawnEnemy(
  rand: () => number,
  kind: EnemyKind,
  spec: EnemySpec,
  bounds: PlayerBounds,
): EnemyState {
  const size = spec.size;
  const y = range(rand, bounds.top, bounds.bottom - size);
  const amplitude = range(rand, spec.minAmplitude, spec.maxAmplitude);
  const side: -1 | 1 = rand() < 0.5 ? -1 : 1;
  const spin = range(rand, spec.spinMin ?? 0, spec.spinMax ?? 0) * (rand() < 0.5 ? -1 : 1);
  return {
    kind,
    x: bounds.right,
    y,
    w: size,
    h: size,
    vx: -range(rand, spec.minSpeed, spec.maxSpeed),
    jitter: spec.jitter,
    homing: spec.homing ?? 0,
    side,
    targetOffset: (spec.sideOffset ?? 0) * side,
    baseY: y,
    phase: rand() * Math.PI * 2,
    amplitude,
    wobble: range(rand, spec.minWobble, spec.maxWobble),
    angle: rand() * Math.PI * 2,
    spin,
  };
}

/**
 * Advance an enemy one step.
 *
 * Non-homing kinds follow their wobble path: a two-term (compound) sine so it
 * does not read as a clean, predictable wave, with optional horizontal `jitter`.
 *
 * Homing kinds ignore the wobble and steer vertically toward `targetCenterY`
 * (the player's centre) at up to `homing` px/s, aiming `targetOffset` to one
 * side — so hunters converge on the player's flank. Pass the player's centre Y
 * to enable homing; omit it and hunters simply hold their altitude.
 */
export function stepEnemy(
  enemy: EnemyState,
  dt: number,
  bounds: PlayerBounds,
  targetCenterY?: number,
): void {
  enemy.phase += enemy.wobble * dt;
  const twoPi = Math.PI * 2;
  enemy.angle = (enemy.angle + enemy.spin * dt) % twoPi;

  const drift = enemy.vx + Math.sin(enemy.phase * 1.7) * enemy.jitter;
  enemy.x += drift * dt;

  if (enemy.homing > 0 && targetCenterY !== undefined) {
    const targetY = targetCenterY + enemy.targetOffset - enemy.h / 2;
    const delta = targetY - enemy.y;
    const maxStep = enemy.homing * dt;
    const steered = enemy.y + clamp(delta, -maxStep, maxStep);
    enemy.y = clamp(steered, bounds.top, bounds.bottom - enemy.h);
    return;
  }

  const wobbled =
    enemy.baseY +
    Math.sin(enemy.phase) * enemy.amplitude +
    Math.sin(enemy.phase * 2.3) * enemy.amplitude * 0.35;
  enemy.y = clamp(wobbled, bounds.top, bounds.bottom - enemy.h);
}

/** True once the enemy has fully left the field on the left. */
export function isEnemyGone(enemy: EnemyState, fieldLeft: number): boolean {
  return enemy.x + enemy.w < fieldLeft;
}
