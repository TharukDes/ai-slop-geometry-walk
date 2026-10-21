import { range } from './mathx';

export interface SpawnerOptions {
  minInterval: number;
  maxInterval: number;
  minIntervalFloor: number;
  /** How many seconds the spawn interval shrinks by, per second of elapsed play. */
  rampPerMinute: number;
}

/**
 * Time-based enemy spawner. The gap between spawns is randomised within a band
 * and slowly shrinks as the run goes on, adding difficulty.
 */
export class Spawner {
  private countdown: number;

  constructor(
    private readonly rand: () => number,
    private readonly options: SpawnerOptions,
  ) {
    this.countdown = this.intervalAt(0);
  }

  intervalAt(elapsedSeconds: number): number {
    const { minInterval, maxInterval, minIntervalFloor, rampPerMinute } = this.options;
    const base = range(this.rand, minInterval, maxInterval);
    const ramp = (elapsedSeconds / 60) * rampPerMinute;
    return Math.max(minIntervalFloor, base - ramp);
  }

  /** Advance the timer; returns true on the frames where an enemy should spawn. */
  update(dt: number, elapsedSeconds: number): boolean {
    this.countdown -= dt;
    if (this.countdown > 0) return false;
    this.countdown += this.intervalAt(elapsedSeconds);
    return true;
  }
}
