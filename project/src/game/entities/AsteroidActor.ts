import { Actor, Circle, Color, GraphicsGroup, Polygon, Vector } from 'excalibur';
import { COLORS } from '../config';
import type { AsteroidState } from '../logic/asteroid';

const ROCK_VERTICES = 12;
const BODY_PADDING = 3;
const CRATER_PADDING = 1;

/**
 * Build a jagged, roughly circular silhouette inside a 2r x 2r box.
 *
 * Every third vertex is a cardinal point at the full radius. That keeps the
 * graphic's bounds centred on the asteroid's circular collision hitbox, while
 * the other vertices jitter inward so each rock has a distinct outline.
 */
function rockPoints(radius: number, rand: () => number): Vector[] {
  const points: Vector[] = [];

  for (let i = 0; i < ROCK_VERTICES; i++) {
    const angle = (i / ROCK_VERTICES) * Math.PI * 2;
    const factor = i % 3 === 0 ? 1 : 0.72 + rand() * 0.28;
    points.push(
      new Vector(
        radius + Math.cos(angle) * radius * factor,
        radius + Math.sin(angle) * radius * factor,
      ),
    );
  }

  return points;
}

/**
 * Small crater circles scattered inside the rock body. `useBounds: false` keeps
 * them out of the graphics group's bounds so they cannot shift the silhouette
 * away from the circular hitbox.
 */
function craterMembers(radius: number, rand: () => number) {
  const count = 2 + Math.floor(rand() * 4);
  const members = [];

  for (let i = 0; i < count; i++) {
    const craterRadius = radius * (0.1 + rand() * 0.08);
    const distance = radius * (0.15 + rand() * 0.35);
    const angle = rand() * Math.PI * 2;
    const centerX = BODY_PADDING + radius + Math.cos(angle) * distance;
    const centerY = BODY_PADDING + radius + Math.sin(angle) * distance;

    members.push({
      graphic: new Circle({
        radius: craterRadius,
        color: Color.fromHex(COLORS.asteroidCrater),
        strokeColor: Color.fromHex(COLORS.asteroid),
        lineWidth: 1,
        padding: CRATER_PADDING,
      }),
      offset: new Vector(
        centerX - CRATER_PADDING - craterRadius,
        centerY - CRATER_PADDING - craterRadius,
      ),
      useBounds: false as const,
    });
  }

  return members;
}

/**
 * A rocky asteroid built from an irregular polygon and crater details. The
 * collision hitbox remains a perfect circle in the pure logic layer.
 */
export class AsteroidActor extends Actor {
  constructor(radius: number, rand: () => number = Math.random) {
    super({
      name: 'asteroid',
      pos: new Vector(0, 0),
      anchor: new Vector(0.5, 0.5),
      z: 7,
    });

    const body = new Polygon({
      points: rockPoints(radius, rand),
      color: Color.fromHex(COLORS.asteroidFill),
      strokeColor: Color.fromHex(COLORS.asteroid),
      lineWidth: 2.5,
      padding: BODY_PADDING,
    });

    this.graphics.use(
      new GraphicsGroup({
        members: [body, ...craterMembers(radius, rand)],
      }),
    );
  }

  sync(state: AsteroidState): void {
    this.pos.x = state.x;
    this.pos.y = state.y;
  }
}
