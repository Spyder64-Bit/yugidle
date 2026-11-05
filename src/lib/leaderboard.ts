/**
 * Browser client for the opt-in global leaderboard (functions/api/*). Nothing is sent unless the
 * player has joined with a nickname.
 */
import type { Board, ResultInput } from './leaderboard-rules.ts';
import { getPending, getPlayer, setPending, setPlayer, solvedDailies, type LbPlayer } from './storage.ts';
import type { Mode, TierName } from './types.ts';

export interface LbRow {
  rank: number;
  nick: string;
  tag: string;
  value: number;
  solved?: number;
}

export interface LbMe {
  rank: number | null;
  value: number;
  solved?: number;
}

/** Error codes the UI translates: the API's own codes plus 'network'. */
export type LbError = 'length' | 'chars' | 'blocked' | 'rate' | 'auth' | 'network' | 'shape';

type Result<T> = { ok: true; data: T } | { ok: false; error: LbError };

async function call<T>(method: string, path: string, body?: unknown, auth = false): Promise<Result<T>> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const player = getPlayer();
  if (auth) {
    if (!player) return { ok: false, error: 'auth' };
    headers.Authorization = `Bearer ${player.token}`;
  }
  try {
    const res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, data: data as T };
    // The server no longer knows this key (player deleted elsewhere): forget it locally.
    if (res.status === 401 && auth) setPlayer(undefined);
    return { ok: false, error: res.status >= 500 ? 'network' : ((data as { error?: LbError }).error ?? 'network') };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export async function join(nick: string, today: number): Promise<Result<LbPlayer>> {
  const r = await call<LbPlayer>('POST', '/api/player', { nick });
  if (!r.ok) return r;
  setPlayer({ token: r.data.token, nick: r.data.nick, tag: r.data.tag });
  // Count the daily puzzles already solved today (and yesterday, still accepted by the server).
  setPending([...getPending(), ...solvedDailies(today - 1)]);
  await flushPending();
  return { ok: true, data: getPlayer()! };
}

export async function rename(nick: string): Promise<Result<LbPlayer>> {
  const r = await call<{ nick: string; tag: string }>('PATCH', '/api/player', { nick }, true);
  if (!r.ok) return r;
  const p = { ...getPlayer()!, nick: r.data.nick, tag: r.data.tag };
  setPlayer(p);
  return { ok: true, data: p };
}

/** Deletes the player and all their results on the server, then forgets the key. */
export async function leave(): Promise<Result<unknown>> {
  const r = await call('DELETE', '/api/player', undefined, true);
  if (r.ok || r.error === 'auth') setPlayer(undefined);
  return r.ok || r.error === 'auth' ? { ok: true, data: null } : r;
}

/** Sends a solved daily puzzle (queued and retried later if offline). No-op if not joined. */
export async function submit(result: ResultInput) {
  if (!getPlayer()) return;
  setPending([...getPending(), result]);
  await flushPending();
}

let flushing = false;

/** Retries queued results; drops the ones the server rejects for good (e.g. too old). */
export async function flushPending() {
  if (flushing || !getPlayer()) return;
  flushing = true;
  try {
    for (const r of getPending()) {
      const res = await call('POST', '/api/result', r, true);
      if (!res.ok && res.error === 'network') break;
      setPending(getPending().filter((p) => p !== r && !(p.day === r.day && p.mode === r.mode && p.tier === r.tier)));
    }
  } finally {
    flushing = false;
  }
}

const query = (board: Board, mode: Mode, tier: TierName) => `/api/leaderboard?board=${board}&mode=${mode}&tier=${tier}`;

export const fetchBoard = (board: Board, mode: Mode, tier: TierName) =>
  call<{ rows: LbRow[] }>('GET', query(board, mode, tier));

export const fetchMe = (board: Board, mode: Mode, tier: TierName) =>
  call<{ me: LbMe | null }>('GET', `${query(board, mode, tier)}&me=1`, undefined, true);
