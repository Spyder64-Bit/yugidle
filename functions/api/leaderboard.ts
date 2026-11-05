/**
 * GET /api/leaderboard?board=today|avg|total|streak[&mode=&tier=]
 *   → { rows: [{ rank, nick, tag, value, solved? }] }   (public, cached at the edge for 60 s)
 * GET /api/leaderboard?...&me=1 with `Authorization: Bearer <key>`
 *   → { me: { rank, value, solved? } | null }          (the caller's own position, not cached)
 *
 * Ranks are competition ranks on the value: equal values share a rank.
 */
import { authPlayer, fail, json, loadSchedule, tagOf, todayOf, type Env } from '../../server/common.ts';
import { AVG_MIN_SOLVES, BOARD_SIZE, isBoard, isMode, isTier, type Board } from '../../src/lib/leaderboard-rules.ts';

interface Row {
  id: string;
  nick: string;
  value: number;
  solved?: number;
}

interface Query {
  board: Board;
  mode: string;
  tier: string;
  today: number;
}

/** SQL per board: the top rows, the caller's value, and how many players beat a value. */
function sql(q: Query) {
  switch (q.board) {
    case 'today':
      return {
        top: [
          `SELECT p.id, p.nick, r.guesses AS value FROM results r JOIN players p ON p.id = r.player
           WHERE r.day = ?1 AND r.mode = ?2 AND r.tier = ?3 ORDER BY r.guesses, r.ts LIMIT ${BOARD_SIZE}`,
          [q.today, q.mode, q.tier],
        ],
        mine: [`SELECT guesses AS value FROM results WHERE player = ?4 AND day = ?1 AND mode = ?2 AND tier = ?3`, [q.today, q.mode, q.tier]],
        better: [`SELECT COUNT(*) AS n FROM results WHERE day = ?1 AND mode = ?2 AND tier = ?3 AND guesses < ?4`, [q.today, q.mode, q.tier]],
      };
    case 'avg': {
      const avg = 'CAST(total_guesses AS REAL) / solved';
      return {
        top: [
          `SELECT p.id, p.nick, ${avg} AS value, m.solved FROM mode_stats m JOIN players p ON p.id = m.player
           WHERE m.mode = ?1 AND m.tier = ?2 AND m.solved >= ${AVG_MIN_SOLVES} ORDER BY value, m.solved DESC LIMIT ${BOARD_SIZE}`,
          [q.mode, q.tier],
        ],
        mine: [`SELECT ${avg} AS value, solved FROM mode_stats WHERE player = ?3 AND mode = ?1 AND tier = ?2`, [q.mode, q.tier]],
        better: [
          `SELECT COUNT(*) AS n FROM mode_stats WHERE mode = ?1 AND tier = ?2 AND solved >= ${AVG_MIN_SOLVES} AND ${avg} < ?3`,
          [q.mode, q.tier],
        ],
      };
    }
    case 'total':
      return {
        top: [`SELECT id, nick, solved AS value FROM players WHERE solved > 0 ORDER BY solved DESC, created LIMIT ${BOARD_SIZE}`, []],
        mine: [`SELECT solved AS value FROM players WHERE id = ?1 AND solved > 0`, []],
        better: [`SELECT COUNT(*) AS n FROM players WHERE solved > ?1`, []],
      };
    case 'streak':
      return {
        top: [
          `SELECT id, nick, streak AS value FROM players WHERE last_day >= ?1 AND streak > 0
           ORDER BY streak DESC, max_streak DESC, created LIMIT ${BOARD_SIZE}`,
          [q.today - 1],
        ],
        mine: [`SELECT streak AS value FROM players WHERE id = ?2 AND last_day >= ?1 AND streak > 0`, [q.today - 1]],
        better: [`SELECT COUNT(*) AS n FROM players WHERE last_day >= ?1 AND streak > ?2`, [q.today - 1]],
      };
  }
}

/** Lower is better for guess counts, higher for totals and streaks. */
const ascending = (b: Board) => b === 'today' || b === 'avg';

function ranked(rows: Row[], asc: boolean) {
  let rank = 0;
  return rows.map((r, i) => {
    if (i === 0 || r.value !== rows[i - 1].value) rank = i + 1;
    return { rank, nick: r.nick, tag: tagOf(r.id), value: asc ? round(r.value) : r.value, solved: r.solved };
  });
}

const round = (v: number) => Math.round(v * 100) / 100;

export const onRequestGet: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const url = new URL(request.url);
  const board = url.searchParams.get('board');
  const mode = url.searchParams.get('mode') ?? 'classic';
  const tier = url.searchParams.get('tier') ?? 'easy';
  if (!isBoard(board) || !isMode(mode) || !isTier(tier)) return fail(400, 'shape');

  const schedule = await loadSchedule(request, env);
  const q: Query = { board, mode, tier, today: todayOf(schedule) };
  const s = sql(q);

  if (url.searchParams.get('me') === '1') {
    const me = await authPlayer(request, env);
    if (!me) return fail(401, 'auth');
    const [mineSql, mineArgs] = s.mine as [string, unknown[]];
    const mine = await env.DB.prepare(mineSql)
      .bind(...mineArgs, me.id)
      .first<{ value: number; solved?: number }>();
    if (!mine || (board === 'avg' && (mine.solved ?? 0) < AVG_MIN_SOLVES)) {
      return json({ me: mine ? { rank: null, value: round(mine.value), solved: mine.solved } : null });
    }
    const [betterSql, betterArgs] = s.better as [string, unknown[]];
    const better = await env.DB.prepare(betterSql)
      .bind(...betterArgs, mine.value)
      .first<{ n: number }>();
    return json({ me: { rank: (better?.n ?? 0) + 1, value: round(mine.value), solved: mine.solved } });
  }

  // Public board: serve from the edge cache when possible (keyed by URL, which includes the day).
  const cacheKey = new Request(`${url.origin}/api/leaderboard?board=${board}&mode=${mode}&tier=${tier}&day=${q.today}`);
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const [topSql, topArgs] = s.top as [string, unknown[]];
  const { results } = await env.DB.prepare(topSql)
    .bind(...topArgs)
    .all<Row>();
  const res = json({ board, mode, tier, day: q.today, rows: ranked(results, ascending(board)) }, 200, {
    'Cache-Control': 'public, max-age=60',
  });
  waitUntil(cache.put(cacheKey, res.clone()));
  return res;
};
