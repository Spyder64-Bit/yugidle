import { seeded } from './rng.ts';
import { scheduleKey, tierPool, type Mode, type Monster, type Schedule, type TierName } from './types.ts';

export const DAY_MS = 86_400_000;

export function dayIndex(epoch: string, nowMs = Date.now()): number {
  return Math.floor((nowMs - Date.parse(`${epoch}T00:00:00Z`)) / DAY_MS);
}

export function msUntilNextDay(nowMs = Date.now()): number {
  return DAY_MS - (nowMs % DAY_MS);
}

/** The daily answer id. Falls back to a seeded pick if the schedule has run out. */
export function dailyAnswer(
  schedule: Schedule,
  monsters: Monster[],
  mode: Mode,
  tier: TierName,
  day: number,
): number {
  const key = scheduleKey(mode, tier);
  const id = schedule.days[key]?.[day];
  const byId = new Set(monsters.map((m) => m.id));
  if (id !== undefined && byId.has(id)) return id;
  const pool = tierPool(monsters, tier);
  return pool[Math.floor(seeded(`fallback:${key}:${day}`)() * pool.length)].id;
}

export function randomAnswer(monsters: Monster[], tier: TierName, avoid?: number): number {
  const pool = tierPool(monsters, tier).filter((m) => m.id !== avoid);
  return pool[Math.floor(Math.random() * pool.length)].id;
}

export function formatCountdown(ms: number): string {
  const s = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
