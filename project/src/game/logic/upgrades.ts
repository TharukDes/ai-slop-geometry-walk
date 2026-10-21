import type { PlayerState } from './player';

export interface Upgrade {
  id: string;
  name: string;
  describe: string;
  apply: (player: PlayerState) => void;
}

export interface UpgradeCaps {
  /** Multiplier applied to the fire interval (below 1 = faster). */
  fireIntervalFactor: number;
  minFireInterval: number;
  speedStep: number;
  maxSpeed: number;
  spreadStep: number;
  maxBulletCount: number;
  damageStep: number;
  maxDamage: number;
}

/**
 * The upgrade pool, as a fixed order. Each boss defeated grants the next one,
 * wrapping around, so a run always progresses and rewards are predictable.
 */
export function upgradesFor(caps: UpgradeCaps): Upgrade[] {
  return [
    {
      id: 'rapid',
      name: 'RAPID FIRE',
      describe: 'shoot faster',
      apply: (p) => {
        p.fireInterval = Math.max(caps.minFireInterval, p.fireInterval * caps.fireIntervalFactor);
      },
    },
    {
      id: 'spread',
      name: 'SPREAD SHOT',
      describe: '+2 bullets per volley',
      apply: (p) => {
        p.bulletCount = Math.min(caps.maxBulletCount, p.bulletCount + caps.spreadStep);
      },
    },
    {
      id: 'engine',
      name: 'ENGINE BOOST',
      describe: 'move faster',
      apply: (p) => {
        p.speed = Math.min(caps.maxSpeed, p.speed + caps.speedStep);
      },
    },
    {
      id: 'life',
      name: 'REINFORCE',
      describe: '+1 life',
      apply: (p) => {
        p.lives += 1;
      },
    },
    {
      id: 'power',
      name: 'POWER SHOT',
      describe: '+1 bullet damage',
      apply: (p) => {
        p.bulletDamage = Math.min(caps.maxDamage, p.bulletDamage + caps.damageStep);
      },
    },
  ];
}

/** Pick the upgrade for a given (0-based) boss number, cycling the pool. */
export function nextUpgrade(index: number, list: Upgrade[]): Upgrade {
  return list[index % list.length]!;
}
