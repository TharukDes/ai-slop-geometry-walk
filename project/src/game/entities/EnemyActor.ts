import { Actor, Color, Polygon, Vector } from 'excalibur';
import { ENEMY_KINDS, type EnemyKind } from '../config';
import type { EnemyState } from '../logic/enemy';

/**
 * A hostile left-pointing triangle. Colour and size are decided by its kind.
 * The apex sits on the leading (left) edge so it reads as flying forward.
 */
export class EnemyActor extends Actor {
  constructor(kind: EnemyKind) {
    const spec = ENEMY_KINDS[kind];
    const size = spec.size;

    super({
      name: `enemy-${kind}`,
      pos: new Vector(0, 0),
      // Centre anchor so `rotation` spins the triangle about the same point the
      // hitbox rotates around (the box centre).
      anchor: new Vector(0.5, 0.5),
      z: 8,
    });

    this.graphics.use(
      new Polygon({
        points: [
          new Vector(size, 0),
          new Vector(size, size),
          new Vector(0, size / 2),
        ],
        color: Color.fromHex(spec.color),
      }),
    );
  }

  sync(state: EnemyState): void {
    // With a centre anchor, `pos` must be the box centre.
    this.pos.x = state.x + state.w / 2;
    this.pos.y = state.y + state.h / 2;
    this.rotation = state.angle;
  }
}
