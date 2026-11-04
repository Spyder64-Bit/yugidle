import { seeded } from '../src/lib/rng.ts';
import { MODES, TIERS, scheduleKey, type Schedule, type TierName } from '../src/lib/types.ts';

export { dayIndex } from '../src/lib/daily.ts';

export function utcDateString(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Extends the schedule so every mode×tier has an answer for each day up to
 * `todayIndex + ahead`. Days that are already assigned are never modified, so
 * adding/removing cards from the pools can't change a puzzle people have played.
 *
 * Picks avoid repeats within a recent window and avoid using the same card
 * twice on the same day across modes of one tier.
 */
export function extendSchedule(
  schedule: Schedule,
  pools: Record<TierName, number[]>,
  todayIndex: number,
  ahead = 60,
): Schedule {
  const days: Record<string, number[]> = {};
  for (const [k, v] of Object.entries(schedule.days)) days[k] = [...v];

  const target = Math.max(0, todayIndex) + ahead + 1;
  for (const tier of TIERS) {
    const pool = pools[tier];
    if (!pool.length) throw new Error(`Empty pool for tier ${tier}`);
    const window = Math.min(Math.floor(pool.length * 0.8), 365);

    for (const mode of MODES) days[scheduleKey(mode, tier)] ??= [];

    for (let day = 0; day < target; day++) {
      const usedToday = new Set<number>();
      for (const mode of MODES) {
        const list = days[scheduleKey(mode, tier)];
        if (day < list.length) {
          usedToday.add(list[day]);
          continue;
        }
        const recent = new Set(list.slice(Math.max(0, day - window), day));
        let candidates = pool.filter((id) => !recent.has(id) && !usedToday.has(id));
        if (!candidates.length) candidates = pool;
        const rng = seeded(`${scheduleKey(mode, tier)}:${day}`);
        const pick = candidates[Math.floor(rng() * candidates.length)];
        list.push(pick);
        usedToday.add(pick);
      }
    }
  }
  return { epoch: schedule.epoch, days };
}
