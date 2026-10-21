import type { Box, Vec2 } from './mathx';
import type { PlayerBounds } from './player';

export interface ProjectileState extends Box {
  vx: number;
  vy: number;
  life: number;
}

export interface VolleySpec {
  /** Edge length of the square projectile. */
  size: number;
  speed: number;
  life: number;
  count: number;
  /** Total angular spread of the burst, in radians. */
  spreadRadians: number;
}

/**
 * Fire a fan of projectiles from `origin` aimed at `target`, spread evenly
 * within `spreadRadians`. A single projectile flies straight at the target.
 */
export function aimedVolley(origin: Vec2, target: Vec2, spec: VolleySpec): ProjectileState[] {
  const baseAngle = Math.atan2(target.y - origin.y, target.x - origin.x);
  const count = Math.max(1, spec.count);
  const projectiles: ProjectileState[] = [];

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const angle = baseAngle + (t - 0.5) * spec.spreadRadians;
    projectiles.push({
      x: origin.x - spec.size / 2,
      y: origin.y - spec.size / 2,
      w: spec.size,
      h: spec.size,
      vx: Math.cos(angle) * spec.speed,
      vy: Math.sin(angle) * spec.speed,
      life: spec.life,
    });
  }

  return projectiles;
}

export function stepProjectile(projectile: ProjectileState, dt: number): void {
  projectile.x += projectile.vx * dt;
  projectile.y += projectile.vy * dt;
  projectile.life -= dt;
}

/** A projectile is spent when its life runs out or it leaves the playfield. */
export function isProjectileSpent(projectile: ProjectileState, bounds: PlayerBounds): boolean {
  return (
    projectile.life <= 0 ||
    projectile.x + projectile.w < bounds.left ||
    projectile.x > bounds.right ||
    projectile.y + projectile.h < bounds.top ||
    projectile.y > bounds.bottom
  );
}
