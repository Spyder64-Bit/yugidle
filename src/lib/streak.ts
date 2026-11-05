/**
 * The daily streak: consecutive days on which the player solved at least one daily puzzle,
 * in any mode and difficulty. Pure functions, shared by the browser and the leaderboard API.
 */
export interface DayStreak {
  streak: number;
  maxStreak: number;
  /** Last day index with a solved daily puzzle, -1 if never. */
  lastDay: number;
}

export const emptyStreak = (): DayStreak => ({ streak: 0, maxStreak: 0, lastDay: -1 });

/** Records a solved daily puzzle on `day`. Solving more puzzles on the same day changes nothing. */
export function advanceStreak(s: DayStreak, day: number): DayStreak {
  if (day <= s.lastDay) return s;
  const streak = day === s.lastDay + 1 ? s.streak + 1 : 1;
  return { streak, maxStreak: Math.max(s.maxStreak, streak), lastDay: day };
}

/** The streak to show on `today`: still alive if the last solve was today or yesterday. */
export const liveStreak = (s: DayStreak, today: number): number => (s.lastDay >= today - 1 ? s.streak : 0);

/**
 * Seeds the global streak for players who had per-mode stats before it existed: the most recent
 * per-mode streak is a lower bound of the real one.
 */
export function seedStreak(perMode: DayStreak[]): DayStreak {
  const s = emptyStreak();
  for (const m of perMode) {
    s.maxStreak = Math.max(s.maxStreak, m.maxStreak);
    if (m.lastDay > s.lastDay || (m.lastDay === s.lastDay && m.streak > s.streak)) {
      s.lastDay = m.lastDay;
      s.streak = m.streak;
    }
  }
  s.maxStreak = Math.max(s.maxStreak, s.streak);
  return s;
}
