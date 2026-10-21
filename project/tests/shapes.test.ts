import { describe, expect, it } from 'vitest';
import {
  boxCorners,
  circleBoxOverlap,
  enemyVertices,
  leftTriangle,
  polygonsOverlap,
  rotateAround,
} from '../src/game/logic/shapes';

describe('boxCorners', () => {
  it('returns the four corners clockwise from the top-left', () => {
    expect(boxCorners({ x: 10, y: 20, w: 30, h: 40 })).toEqual([
      { x: 10, y: 20 },
      { x: 40, y: 20 },
      { x: 40, y: 60 },
      { x: 10, y: 60 },
    ]);
  });
});

describe('leftTriangle', () => {
  it('inscribes a left-pointing triangle in the box', () => {
    const tri = leftTriangle({ x: 0, y: 0, w: 100, h: 100 });
    expect(tri).toEqual([
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 50 },
    ]);
  });

  it('tracks the box position', () => {
    const tri = leftTriangle({ x: 5, y: 7, w: 20, h: 10 });
    expect(tri[2]).toEqual({ x: 5, y: 12 });
  });
});

describe('polygonsOverlap (SAT)', () => {
  const tri = leftTriangle({ x: 0, y: 0, w: 100, h: 100 });

  it('detects a box squarely inside the triangle', () => {
    const inside = boxCorners({ x: 80, y: 40, w: 10, h: 10 });
    expect(polygonsOverlap(tri, inside)).toBe(true);
  });

  it('is symmetric', () => {
    const inside = boxCorners({ x: 80, y: 40, w: 10, h: 10 });
    expect(polygonsOverlap(inside, tri)).toBe(polygonsOverlap(tri, inside));
  });

  it('rejects a box beyond the apex (left of the triangle)', () => {
    const behind = boxCorners({ x: -40, y: 40, w: 10, h: 10 });
    expect(polygonsOverlap(tri, behind)).toBe(false);
  });

  it('rejects a box sitting in the empty top-left corner of the bounding box', () => {
    // The triangle has no material here, unlike its AABB would suggest.
    const emptyCorner = boxCorners({ x: 0, y: 0, w: 8, h: 8 });
    expect(polygonsOverlap(tri, emptyCorner)).toBe(false);
  });

  it('rejects a box in the empty bottom-left corner too', () => {
    const emptyCorner = boxCorners({ x: 0, y: 92, w: 8, h: 8 });
    expect(polygonsOverlap(tri, emptyCorner)).toBe(false);
  });

  it('overlaps the full bounding box region as a positive control', () => {
    const whole = boxCorners({ x: 0, y: 0, w: 100, h: 100 });
    expect(polygonsOverlap(tri, whole)).toBe(true);
  });
});

describe('circleBoxOverlap', () => {
  const box = { x: 0, y: 0, w: 10, h: 10 };

  it('detects a circle centred inside the box', () => {
    expect(circleBoxOverlap({ x: 5, y: 5, r: 1 }, box)).toBe(true);
  });

  it('detects a circle whose edge crosses the box side', () => {
    expect(circleBoxOverlap({ x: 14, y: 5, r: 5 }, box)).toBe(true);
  });

  it('rejects a circle that is clear of the box', () => {
    expect(circleBoxOverlap({ x: 20, y: 5, r: 5 }, box)).toBe(false);
  });

  it('treats an exact touch as not overlapping', () => {
    expect(circleBoxOverlap({ x: 15, y: 5, r: 5 }, box)).toBe(false);
  });

  it('measures distance to the nearest corner, not the box centre', () => {
    // Distance from (13, 13) to the corner (10, 10) is sqrt(18) ~= 4.2426.
    expect(circleBoxOverlap({ x: 13, y: 13, r: 4.3 }, box)).toBe(true);
    expect(circleBoxOverlap({ x: 13, y: 13, r: 4.2 }, box)).toBe(false);
  });

  it('handles a box that is not at the origin', () => {
    const moved = { x: 100, y: 200, w: 30, h: 30 };
    expect(circleBoxOverlap({ x: 115, y: 215, r: 5 }, moved)).toBe(true);
    expect(circleBoxOverlap({ x: 60, y: 215, r: 5 }, moved)).toBe(false);
  });
});

describe('rotateAround', () => {
  it('rotates a point a quarter turn about the origin', () => {
    const p = rotateAround({ x: 1, y: 0 }, { x: 0, y: 0 }, Math.PI / 2);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(1);
  });

  it('preserves distance from the centre', () => {
    const center = { x: 4, y: -2 };
    const p = rotateAround({ x: 10, y: 5 }, center, 1.234);
    const before = Math.hypot(10 - center.x, 5 - center.y);
    const after = Math.hypot(p.x - center.x, p.y - center.y);
    expect(after).toBeCloseTo(before);
  });
});

describe('enemyVertices', () => {
  it('is the left-pointing triangle when there is no rotation', () => {
    const enemy = { x: 100, y: 50, w: 30, h: 30, angle: 0 };
    expect(enemyVertices(enemy)).toEqual(leftTriangle(enemy));
  });

  it('spins the hitbox about the box centre', () => {
    const enemy = { x: 0, y: 0, w: 10, h: 10, angle: Math.PI };
    // Base triangle (10,0),(10,10),(0,5) rotated 180 deg about (5,5).
    const spun = enemyVertices(enemy);
    expect(spun[0]!.x).toBeCloseTo(0);
    expect(spun[0]!.y).toBeCloseTo(10);
    expect(spun[2]!.x).toBeCloseTo(10);
    expect(spun[2]!.y).toBeCloseTo(5);
  });

  it('keeps every vertex the same distance from the centre while spinning', () => {
    const enemy = { x: 0, y: 0, w: 20, h: 20, angle: 0 };
    const center = { x: 10, y: 10 };
    const base = leftTriangle(enemy).map((p) => Math.hypot(p.x - center.x, p.y - center.y));
    for (const angle of [0.5, 1.5, 3.1, 5.9]) {
      const spun = enemyVertices({ ...enemy, angle }).map((p) =>
        Math.hypot(p.x - center.x, p.y - center.y),
      );
      spun.forEach((d, i) => expect(d).toBeCloseTo(base[i]!));
    }
  });

  it('still collides with a box that overlaps the spun triangle', () => {
    const enemy = { x: 0, y: 0, w: 100, h: 100, angle: Math.PI / 2 };
    // Rotated a quarter turn, the apex points up; a box near the top edge hits.
    const box = boxCorners({ x: 45, y: 5, w: 10, h: 10 });
    expect(polygonsOverlap(enemyVertices(enemy), box)).toBe(true);
  });
});
