import { clamp, type Box, type Vec2 } from './mathx';

export interface Circle {
  x: number;
  y: number;
  r: number;
}

/** The four corners of an axis-aligned box, clockwise from the top-left. */
export function boxCorners(box: Box): Vec2[] {
  return [
    { x: box.x, y: box.y },
    { x: box.x + box.w, y: box.y },
    { x: box.x + box.w, y: box.y + box.h },
    { x: box.x, y: box.y + box.h },
  ];
}

/**
 * A left-pointing triangle (arrowhead) inscribed in `box`, with its point on
 * the left edge. Enemies travel leftward, so this reads as flying forward.
 */
export function leftTriangle(box: Box): Vec2[] {
  return [
    { x: box.x + box.w, y: box.y },
    { x: box.x + box.w, y: box.y + box.h },
    { x: box.x, y: box.y + box.h / 2 },
  ];
}

/** Rotate a point `angle` radians around `center`. */
export function rotateAround(point: Vec2, center: Vec2, angle: number): Vec2 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/**
 * Vertices of an enemy's triangular hitbox, rotated about the box centre by the
 * enemy's `angle` so the hitbox spins exactly with the drawn triangle.
 */
export function enemyVertices(enemy: Box & { angle?: number }): Vec2[] {
  const base = leftTriangle(enemy);
  const angle = enemy.angle ?? 0;
  if (angle === 0) return base;

  const center = { x: enemy.x + enemy.w / 2, y: enemy.y + enemy.h / 2 };
  return base.map((point) => rotateAround(point, center, angle));
}

/** Outward normals of every edge in a convex polygon. */
function edgeAxes(poly: Vec2[]): Vec2[] {
  const axes: Vec2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    // Perpendicular to the edge; need not be unit length for SAT.
    axes.push({ x: -(b.y - a.y), y: b.x - a.x });
  }
  return axes;
}

function project(poly: Vec2[], axis: Vec2): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const v of poly) {
    const dot = v.x * axis.x + v.y * axis.y;
    if (dot < min) min = dot;
    if (dot > max) max = dot;
  }
  return [min, max];
}

/**
 * Circle vs axis-aligned box. Finds the point on the box nearest the circle's
 * centre and compares the distance to the radius.
 */
export function circleBoxOverlap(circle: Circle, box: Box): boolean {
  const nearestX = clamp(circle.x, box.x, box.x + box.w);
  const nearestY = clamp(circle.y, box.y, box.y + box.h);
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx * dx + dy * dy < circle.r * circle.r;
}

/**
 * Separating Axis Theorem test for two convex polygons. Returns true when they
 * overlap; touching edges count as overlapping.
 */
export function polygonsOverlap(a: Vec2[], b: Vec2[]): boolean {
  for (const axis of [...edgeAxes(a), ...edgeAxes(b)]) {
    if (axis.x === 0 && axis.y === 0) continue;
    const [aMin, aMax] = project(a, axis);
    const [bMin, bMax] = project(b, axis);
    if (aMax < bMin || bMax < aMin) return false;
  }
  return true;
}
