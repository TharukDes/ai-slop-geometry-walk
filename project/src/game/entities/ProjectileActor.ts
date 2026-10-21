import { Actor, Color, Rectangle, Vector } from 'excalibur';
import { BOSS } from '../config';
import type { ProjectileState } from '../logic/projectile';

/**
 * A boss projectile: a small square. Top-left anchored so the drawn box matches
 * the collision box exactly.
 */
export class ProjectileActor extends Actor {
  constructor() {
    super({
      name: 'boss-projectile',
      pos: new Vector(0, 0),
      anchor: new Vector(0, 0),
      z: 9,
    });

    this.graphics.use(
      new Rectangle({
        width: BOSS.projectileSize,
        height: BOSS.projectileSize,
        color: Color.fromHex(BOSS.projectileColor),
      }),
    );
  }

  sync(state: ProjectileState): void {
    this.pos.x = state.x;
    this.pos.y = state.y;
  }
}
