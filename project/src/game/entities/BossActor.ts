import { Actor, Color, Polygon, Vector } from 'excalibur';
import { BOSS } from '../config';
import type { BossState } from '../logic/boss';

/**
 * A large spinning triangle. Uses a centre anchor so its rotation matches the
 * triangular hitbox the scene tests against.
 */
export class BossActor extends Actor {
  constructor() {
    const size = BOSS.size;

    super({
      name: 'boss',
      pos: new Vector(0, 0),
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
        color: Color.fromHex(BOSS.color),
      }),
    );
  }

  sync(state: BossState): void {
    this.pos.x = state.x + state.w / 2;
    this.pos.y = state.y + state.h / 2;
    this.rotation = state.angle;
  }
}
