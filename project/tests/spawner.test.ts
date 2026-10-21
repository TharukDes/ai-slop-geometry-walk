import { describe, expect, it } from 'vitest';
import { Spawner, type SpawnerOptions } from '../src/game/logic/spawner';

const OPTIONS: SpawnerOptions = {
  minInterval: 0.4,
  maxInterval: 0.4,
  minIntervalFloor: 0.1,
  rampPerMinute: 0.5,
};

describe('Spawner', () => {
  it('does not spawn before the interval elapses', () => {
    const spawner = new Spawner(() => 0.5, OPTIONS);
    expect(spawner.update(0.2, 0)).toBe(false);
    expect(spawner.update(0.1, 0)).toBe(false);
  });

  it('spawns once the interval elapses', () => {
    const spawner = new Spawner(() => 0.5, OPTIONS);
    expect(spawner.update(0.41, 0)).toBe(true);
  });

  it('spawns roughly once per interval over a long window', () => {
    const spawner = new Spawner(() => 0, { ...OPTIONS, rampPerMinute: 0 });
    let count = 0;
    for (let i = 0; i < 600; i++) {
      if (spawner.update(1 / 60, 0)) count += 1;
    }
    // 10 seconds at a fixed 0.4s interval -> ~25 spawns.
    expect(count).toBeGreaterThanOrEqual(23);
    expect(count).toBeLessThanOrEqual(27);
  });

  it('shortens the interval as time passes, down to the floor', () => {
    const spawner = new Spawner(() => 0.5, { ...OPTIONS, minInterval: 0.8, maxInterval: 0.8 });
    expect(spawner.intervalAt(0)).toBeCloseTo(0.8);
    expect(spawner.intervalAt(60)).toBeCloseTo(0.3);
    // ramp far past the floor, clamped.
    expect(spawner.intervalAt(600)).toBeCloseTo(OPTIONS.minIntervalFloor);
  });
});
