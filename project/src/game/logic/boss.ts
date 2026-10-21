import { clamp, range, type Box } from './mathx';
import type { PlayerBounds } from './player';

export interface BossState extends Box {
  hp: number;
  maxHp: number;
  /** Approach velocity while flying in from the right. */
  vx: number;
  /** X position the boss settles at once it has entered. */
  hoverX: number;
  entering: boolean;
  baseY: number;
  phase: number;
  amplitude: number;
  wobble: number;
  angle: number;
  spin: number;

  /** Seconds until the next attack burst. */
  fireCooldown: number;
  /** Seconds between attack bursts. */
  fireInterval: number;
  /** Projectiles per burst. */
  volley: number;
  /** Projectile speed, px/s. */
  projectileSpeed: number;
  /** Total angular spread of a burst, in radians. */
  spread: number;
}

export interface BossSpec {
  size: number;
  /** Gap between the boss and the right edge once at rest, in px. */
  hoverMargin: number;
  approachSpeed: number;
  minAmplitude: number;
  maxAmplitude: number;
  minWobble: number;
  maxWobble: number;
  spin: number;
  baseHp: number;
  /** Extra HP granted per boss (0 for the first). */
  hpPerBoss: number;

  baseFireInterval: number;
  fireIntervalPerBoss: number;
  minFireInterval: number;
  baseVolley: number;
  volleyPerBoss: number;
  maxVolley: number;
  baseProjectileSpeed: number;
  projectileSpeedPerBoss: number;
  maxProjectileSpeed: number;
  baseSpread: number;
  spreadPerBoss: number;
  maxSpread: number;
}

/**
 * Spawn a boss off the right edge. HP, attack rate, burst size, projectile speed
 * and spread all scale with `bossNumber`, so each fight is harder than the last.
 */
export function spawnBoss(
  rand: () => number,
  spec: BossSpec,
  bounds: PlayerBounds,
  bossNumber: number,
): BossState {
  const n = Math.max(0, bossNumber);
  const hp = spec.baseHp + spec.hpPerBoss * n;
  const baseY = bounds.top + (bounds.bottom - bounds.top - spec.size) / 2;
  const fireInterval = Math.max(spec.minFireInterval, spec.baseFireInterval - spec.fireIntervalPerBoss * n);

  return {
    x: bounds.right,
    y: baseY,
    w: spec.size,
    h: spec.size,
    hp,
    maxHp: hp,
    vx: -spec.approachSpeed,
    hoverX: bounds.right - spec.hoverMargin - spec.size,
    entering: true,
    baseY,
    phase: rand() * Math.PI * 2,
    amplitude: range(rand, spec.minAmplitude, spec.maxAmplitude),
    wobble: range(rand, spec.minWobble, spec.maxWobble),
    angle: 0,
    spin: spec.spin,
    fireCooldown: fireInterval,
    fireInterval,
    volley: Math.min(spec.maxVolley, spec.baseVolley + spec.volleyPerBoss * n),
    projectileSpeed: Math.min(
      spec.maxProjectileSpeed,
      spec.baseProjectileSpeed + spec.projectileSpeedPerBoss * n,
    ),
    spread: Math.min(spec.maxSpread, spec.baseSpread + spec.spreadPerBoss * n),
  };
}

/**
 * Advance a boss: fly in to `hoverX`, then oscillate vertically while spinning.
 */
export function stepBoss(boss: BossState, dt: number, bounds: PlayerBounds): void {
  boss.angle = (boss.angle + boss.spin * dt) % (Math.PI * 2);

  if (boss.entering) {
    boss.x += boss.vx * dt;
    if (boss.x <= boss.hoverX) {
      boss.x = boss.hoverX;
      boss.entering = false;
    }
    return;
  }

  boss.phase += boss.wobble * dt;
  const y = boss.baseY + Math.sin(boss.phase) * boss.amplitude;
  boss.y = clamp(y, bounds.top, bounds.bottom - boss.h);
}

/**
 * Tick the boss's attack timer. Returns true on the frames where it should fire
 * a burst. Bosses hold fire while flying in.
 */
export function tickBossAttack(boss: BossState, dt: number): boolean {
  if (boss.entering) return false;
  boss.fireCooldown -= dt;
  if (boss.fireCooldown <= 0) {
    boss.fireCooldown += boss.fireInterval;
    return true;
  }
  return false;
}

export function damageBoss(boss: BossState, amount: number): void {
  boss.hp = Math.max(0, boss.hp - amount);
}

export function isBossDead(boss: BossState): boolean {
  return boss.hp <= 0;
}
