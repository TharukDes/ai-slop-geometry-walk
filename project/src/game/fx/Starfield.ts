import { Actor, Color, Rectangle, Scene, Vector } from 'excalibur';
import { COLORS } from '../config';

interface Star {
  actor: Actor;
  x: number;
  y: number;
  speed: number;
}

interface Layer {
  count: number;
  speed: number;
  size: number;
  opacity: number;
}

const LAYERS: Layer[] = [
  { count: 60, speed: 40, size: 1, opacity: 0.35 },
  { count: 34, speed: 90, size: 2, opacity: 0.6 },
  { count: 16, speed: 170, size: 3, opacity: 0.9 },
];

/**
 * Parallax starfield that scrolls left to sell the sense of forward motion.
 * Stars wrap around to the right edge once they leave the screen.
 */
export class Starfield {
  private readonly stars: Star[] = [];

  constructor(
    scene: Scene,
    private readonly width: number,
    private readonly height: number,
    rand: () => number = Math.random,
  ) {
    for (const layer of LAYERS) {
      for (let i = 0; i < layer.count; i++) {
        const x = rand() * width;
        const y = rand() * height;
        const actor = new Actor({
          name: 'star',
          pos: new Vector(x, y),
          anchor: new Vector(0, 0),
          width: layer.size,
          height: layer.size,
          color: Color.fromHex(COLORS.star),
          z: -10,
        });
        actor.graphics.use(
          new Rectangle({
            width: layer.size,
            height: layer.size,
            color: Color.fromHex(COLORS.star),
          }),
        );
        actor.graphics.opacity = layer.opacity;
        scene.add(actor);
        this.stars.push({ actor, x, y, speed: layer.speed });
      }
    }
  }

  update(dt: number): void {
    for (const star of this.stars) {
      star.x -= star.speed * dt;
      if (star.x < 0) {
        star.x += this.width;
        star.y = Math.random() * this.height;
      }
      star.actor.pos.x = star.x;
      star.actor.pos.y = star.y;
    }
  }
}
