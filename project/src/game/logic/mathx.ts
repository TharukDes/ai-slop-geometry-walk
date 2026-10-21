export interface Vec2 {
  x: number;
  y: number;
}

/** An axis-aligned rectangle described by its top-left corner and size. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function clamp(value: number, lo: number, hi: number): number {
  if (value < lo) return lo;
  if (value > hi) return hi;
  return value;
}

/** True when two axis-aligned boxes overlap. Touching edges do not count. */
export function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Uniform random in [min, max). */
export function range(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}
