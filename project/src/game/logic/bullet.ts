import type { Box } from './mathx';

export interface BulletState extends Box {
  vx: number;
  vy: number;
  /** Remaining lifetime in seconds. */
  life: number;
  /** Damage dealt on impact. */
  damage: number;
}

export interface BulletSpec {
  width: number;
  height: number;
  /** Muzzle speed, px/s. */
  speed: number;
  life: number;
  muzzleOffset: number;
  /** Bullets per volley; defaults to 1. */
  count?: number;
  /** Total angular spread across the volley, in radians. */
  spreadRadians?: number;
  /** Damage per bullet; defaults to 1. */
  damage?: number;
}

/**
 * Fire a volley from the player's leading (right) edge. Multiple bullets fan out
 * symmetrically within `spreadRadians`, so odd counts keep one shot straight
 * ahead.
 */
export function fireVolley(player: Box, spec: BulletSpec): BulletState[] {
  const count = Math.max(1, spec.count ?? 1);
  const spread = spec.spreadRadians ?? 0;
  const damage = spec.damage ?? 1;

  const x = player.x + player.w + spec.muzzleOffset;
  const y = player.y + player.h / 2 - spec.height / 2;
  const bullets: BulletState[] = [];

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const angle = (t - 0.5) * spread;
    bullets.push({
      x,
      y,
      w: spec.width,
      h: spec.height,
      vx: spec.speed * Math.cos(angle),
      vy: spec.speed * Math.sin(angle),
      life: spec.life,
      damage,
    });
  }

  return bullets;
}

/** Single-shot convenience wrapper around {@link fireVolley}. */
export function fireBullet(player: Box, spec: BulletSpec): BulletState {
  return fireVolley(player, { ...spec, count: 1, spreadRadians: 0 })[0]!;
}

export function stepBullet(bullet: BulletState, dt: number): void {
  bullet.x += bullet.vx * dt;
  bullet.y += bullet.vy * dt;
  bullet.life -= dt;
}

/** A bullet is done once its lifetime runs out or it leaves the playfield. */
export function isBulletSpent(bullet: BulletState, fieldRight: number): boolean {
  return bullet.life <= 0 || bullet.x > fieldRight;
}
