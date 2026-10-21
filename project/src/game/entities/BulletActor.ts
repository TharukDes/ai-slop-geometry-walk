import { Actor, Color, Rectangle, Vector } from 'excalibur';
import { BULLET, COLORS } from '../config';
import type { BulletState } from '../logic/bullet';

/** A small player projectile that streaks to the right. */
export class BulletActor extends Actor {
  constructor() {
    super({
      name: 'bullet',
      pos: new Vector(0, 0),
      // Top-left anchor keeps the visual box aligned with the logic hitbox.
      anchor: new Vector(0, 0),
      width: BULLET.width,
      height: BULLET.height,
      color: Color.fromHex(COLORS.bullet),
      z: 9,
    });

    this.graphics.use(
      new Rectangle({
        width: BULLET.width,
        height: BULLET.height,
        color: Color.fromHex(COLORS.bullet),
      }),
    );
  }

  sync(state: BulletState): void {
    this.pos.x = state.x;
    this.pos.y = state.y;
  }
}
