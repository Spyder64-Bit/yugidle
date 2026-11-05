/**
 * POST /api/result: records a solved daily puzzle for the authenticated player.
 * Body: { day, mode, tier, guesses: number[] }. The server checks that the last guess is that
 * day's answer; each puzzle counts once per player.
 */
import { authPlayer, fail, json, loadSchedule, readJson, todayOf, type Env } from '../../server/common.ts';
import { checkResult } from '../../src/lib/leaderboard-rules.ts';
import { advanceStreak } from '../../src/lib/streak.ts';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const me = await authPlayer(request, env);
  if (!me) return fail(401, 'auth');

  const schedule = await loadSchedule(request, env);
  const r = checkResult(await readJson(request), schedule, todayOf(schedule));
  if (typeof r === 'string') return fail(422, r);
  const n = r.guesses.length;

  const ins = await env.DB.prepare(
    'INSERT OR IGNORE INTO results (player, day, mode, tier, guesses, ts) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(me.id, r.day, r.mode, r.tier, n, Date.now())
    .run();
  if (!ins.meta.changes) return json({ recorded: false });

  const s = advanceStreak({ streak: me.streak, maxStreak: me.max_streak, lastDay: me.last_day }, r.day);
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO mode_stats (player, mode, tier, solved, total_guesses, best) VALUES (?, ?, ?, 1, ?, ?)
       ON CONFLICT (player, mode, tier) DO UPDATE SET
         solved = solved + 1, total_guesses = total_guesses + excluded.total_guesses, best = MIN(best, excluded.best)`,
    ).bind(me.id, r.mode, r.tier, n, n),
    env.DB.prepare(
      'UPDATE players SET solved = solved + 1, streak = ?, max_streak = MAX(max_streak, ?), last_day = MAX(last_day, ?) WHERE id = ?',
    ).bind(s.streak, s.maxStreak, s.lastDay, me.id),
  ]);
  return json({ recorded: true, streak: s.streak });
};
