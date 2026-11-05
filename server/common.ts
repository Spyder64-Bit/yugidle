/**
 * Helpers for the leaderboard Pages Functions (functions/api/*). Kept outside functions/ so they
 * never become routes.
 */
import { dayIndex } from '../src/lib/daily.ts';
import type { Schedule } from '../src/lib/types.ts';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  /** Secret salt for hashing IPs in the anti-spam counter (wrangler pages secret put IP_SALT). */
  IP_SALT?: string;
}

export interface Player {
  id: string;
  nick: string;
  solved: number;
  streak: number;
  max_streak: number;
  last_day: number;
}

const MAX_BODY = 8 * 1024;

export const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });

export const fail = (status: number, error: string) => json({ error }, status);

/** Parses a small JSON body; returns undefined if it is missing, too big or invalid. */
export async function readJson(request: Request): Promise<unknown> {
  const len = Number(request.headers.get('Content-Length') ?? 0);
  if (len > MAX_BODY) return undefined;
  const text = await request.text();
  if (text.length > MAX_BODY) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Public 4-character tag shown after the nickname, so equal nicknames can be told apart. */
export const tagOf = (id: string) => id.replace(/-/g, '').slice(0, 4).toUpperCase();

/** The player owning the bearer token in the Authorization header, or null. */
export async function authPlayer(request: Request, env: Env): Promise<Player | null> {
  const m = /^Bearer ([0-9a-f]{64})$/.exec(request.headers.get('Authorization') ?? '');
  if (!m) return null;
  return env.DB.prepare(
    'SELECT id, nick, solved, streak, max_streak, last_day FROM players WHERE token_hash = ?',
  )
    .bind(await sha256(m[1]))
    .first<Player>();
}

let cached: { at: number; schedule: Schedule } | null = null;

/** The daily schedule, read from the site's own static assets (cached per isolate for 10 min). */
export async function loadSchedule(request: Request, env: Env): Promise<Schedule> {
  if (cached && Date.now() - cached.at < 600_000) return cached.schedule;
  const res = await env.ASSETS.fetch(new URL('/data/schedule.json', request.url));
  if (!res.ok) throw new Error(`schedule: HTTP ${res.status}`);
  cached = { at: Date.now(), schedule: (await res.json()) as Schedule };
  return cached.schedule;
}

export const todayOf = (schedule: Schedule) => dayIndex(schedule.epoch);
