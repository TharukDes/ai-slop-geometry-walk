import { Actor, Circle, Color, Vector } from 'excalibur';
import { COLORS } from '../config';
import type { AsteroidState } from '../logic/asteroid';

/**
 * A circular asteroid. Uses a centre anchor: the Circle graphic pads itself
 * symmetrically, so its anchor lands on the true centre, and `pos` therefore
 * matches the circular hitbox exactly.
 */
export class AsteroidActor extends Actor {
  constructor(radius: number) {
    super({
      name: 'asteroid',
      pos: new Vector(0, 0),
      anchor: new Vector(0.5, 0.5),
      z: 7,
    });

    this.graphics.use(
      new Circle({
        radius,
        color: Color.fromHex(COLORS.asteroidFill),
        strokeColor: Color.fromHex(COLORS.asteroid),
        lineWidth: 3,
      }),
    );
  }

  sync(state: AsteroidState): void {
    this.pos.x = state.x;
    this.pos.y = state.y;
  }
}
