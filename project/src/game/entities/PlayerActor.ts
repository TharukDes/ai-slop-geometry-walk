import { Actor, Color, Rectangle, Vector } from 'excalibur';
import { COLORS, PLAYER } from '../config';
import type { PlayerState } from '../logic/player';

/**
 * The player: a cyan cube. Rendering only — all movement lives in the pure
 * `PlayerState`/`stepPlayer` logic and is mirrored onto this actor each frame.
 */
export class PlayerActor extends Actor {
  constructor() {
    super({
      name: 'player',
      pos: new Vector(0, 0),
      // Excalibur defaults to a centre anchor; pin to the top-left so the drawn
      // cube lines up exactly with the collision box in the pure logic layer.
      anchor: new Vector(0, 0),
      width: PLAYER.size,
      height: PLAYER.size,
      color: Color.fromHex(COLORS.player),
      z: 10,
    });

    this.graphics.use(
      new Rectangle({
        width: PLAYER.size,
        height: PLAYER.size,
        color: Color.fromHex(COLORS.playerFill),
        strokeColor: Color.fromHex(COLORS.player),
        lineWidth: 2,
      }),
    );
  }

  sync(state: PlayerState): void {
    this.pos.x = state.x;
    this.pos.y = state.y;
    this.graphics.opacity = this.opacityFor(state);
  }

  private opacityFor(state: PlayerState): number {
    if (state.invuln <= 0) return 1;
    // Blink while invulnerable so the hit reads clearly.
    return Math.floor(state.invuln * 12) % 2 === 0 ? 0.35 : 1;
  }
}
