/**
 * /api/player: join the leaderboard (POST), see yourself (GET), rename (PATCH), leave and delete
 * all your data (DELETE). Every call but POST needs `Authorization: Bearer <key>`.
 */
import { authPlayer, fail, json, newToken, readJson, sha256, tagOf, type Env } from '../../server/common.ts';
import { cleanNick, nickError } from '../../src/lib/leaderboard-rules.ts';

/** New players allowed per IP per day (anti-spam). */
const SIGNUPS_PER_DAY = 5;

async function nickFrom(request: Request): Promise<string | Response> {
  const body = (await readJson(request)) as { nick?: unknown } | undefined;
  if (typeof body?.nick !== 'string') return fail(400, 'shape');
  const err = nickError(body.nick);
  return err ? fail(422, err) : cleanNick(body.nick);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const nick = await nickFrom(request);
  if (nick instanceof Response) return nick;

  // Count signups per salted IP hash; the raw IP is never stored, and old rows are purged daily.
  const day = Math.floor(Date.now() / 86_400_000);
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const ipHash = await sha256(`${env.IP_SALT ?? 'yugidle'}:${day}:${ip}`);
  const row = await env.DB.prepare('SELECT n FROM signups WHERE ip_hash = ? AND day = ?')
    .bind(ipHash, day)
    .first<{ n: number }>();
  if ((row?.n ?? 0) >= SIGNUPS_PER_DAY) return fail(429, 'rate');

  const id = crypto.randomUUID();
  const token = newToken();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM signups WHERE day < ?').bind(day),
    env.DB.prepare(
      'INSERT INTO signups (ip_hash, day, n) VALUES (?, ?, 1) ON CONFLICT (ip_hash, day) DO UPDATE SET n = n + 1',
    ).bind(ipHash, day),
    env.DB.prepare('INSERT INTO players (id, token_hash, nick, created) VALUES (?, ?, ?, ?)').bind(
      id,
      await sha256(token),
      nick,
      Date.now(),
    ),
  ]);
  return json({ token, nick, tag: tagOf(id) }, 201);
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const me = await authPlayer(request, env);
  if (!me) return fail(401, 'auth');
  return json({
    nick: me.nick,
    tag: tagOf(me.id),
    solved: me.solved,
    streak: me.streak,
    maxStreak: me.max_streak,
    lastDay: me.last_day,
  });
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  const me = await authPlayer(request, env);
  if (!me) return fail(401, 'auth');
  const nick = await nickFrom(request);
  if (nick instanceof Response) return nick;
  await env.DB.prepare('UPDATE players SET nick = ? WHERE id = ?').bind(nick, me.id).run();
  return json({ nick, tag: tagOf(me.id) });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const me = await authPlayer(request, env);
  if (!me) return fail(401, 'auth');
  await env.DB.batch([
    env.DB.prepare('DELETE FROM results WHERE player = ?').bind(me.id),
    env.DB.prepare('DELETE FROM mode_stats WHERE player = ?').bind(me.id),
    env.DB.prepare('DELETE FROM players WHERE id = ?').bind(me.id),
  ]);
  return json({ deleted: true });
};
