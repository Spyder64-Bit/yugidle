<script lang="ts">
  import { untrack } from 'svelte';
  import { app } from '../lib/app.svelte.ts';
  import {
    fetchBoard,
    fetchMe,
    join,
    leave,
    rename,
    type LbError,
    type LbMe,
    type LbRow,
  } from '../lib/leaderboard.ts';
  import { AVG_MIN_SOLVES, BOARDS, NICK_MAX, nickError, type Board } from '../lib/leaderboard-rules.ts';
  import { getPlayer } from '../lib/storage.ts';
  import { MODES, TIERS, type Mode, type TierName } from '../lib/types.ts';
  import Modal from './Modal.svelte';

  let { onclose }: { onclose: () => void } = $props();

  const BOARD_ICON: Record<Board, string> = { today: '📅', avg: '🎯', total: '🏅', streak: '🔥' };

  let board = $state<Board>('today');
  let mode = $state<Mode>(untrack(() => app.settings.mode));
  let tier = $state<TierName>(untrack(() => app.settings.tier));
  const perMode = $derived(board === 'today' || board === 'avg');

  let player = $state(getPlayer());
  let rows = $state<LbRow[] | null>(null);
  let me = $state<LbMe | null>(null);
  let loadError = $state(false);

  let nick = $state('');
  let editing = $state(false);
  let busy = $state(false);
  let error = $state<LbError | null>(null);
  const localError = $derived(nick.trim() ? nickError(nick) : null);

  async function load() {
    const [b, m, t] = [board, mode, tier];
    rows = null;
    loadError = false;
    const [res, mine] = await Promise.all([fetchBoard(b, m, t), player ? fetchMe(b, m, t) : null]);
    if (b !== board || m !== mode || t !== tier) return; // a newer request is on its way
    if (res.ok) rows = res.data.rows;
    else loadError = true;
    me = mine?.ok ? mine.data.me : null;
    player = getPlayer(); // a 401 may have forgotten a deleted player
  }

  $effect(() => {
    void [board, mode, tier];
    untrack(load);
  });

  const isMe = (r: LbRow) => !!player && r.nick === player.nick && r.tag === player.tag;

  // Public boards are edge-cached for a few seconds, so a fresh result may be missing: place the
  // player's own (always fresh) row at their real rank. Stale copies of it are dropped.
  const shown = $derived.by(() => {
    if (!rows || !player || !me || me.rank === null) return rows;
    const list = rows.filter((r) => !isMe(r));
    const row: LbRow = { rank: me.rank, nick: player.nick, tag: player.tag, value: me.value, solved: me.solved };
    const rank = me.rank;
    // Today has unique ranks (ties broken by time); other boards share ranks on equal values.
    const at = list.findIndex((r) => (board === 'today' ? r.rank >= rank : r.rank > rank || (r.rank === rank && r.value !== me!.value)));
    if (at === -1 && rank > list.length + 1) return list;
    list.splice(at === -1 ? list.length : at, 0, row);
    if (board === 'today') for (let i = 1; i < list.length; i++) list[i] = { ...list[i], rank: Math.max(list[i].rank, list[i - 1].rank + 1) };
    return list;
  });
  const meInRows = $derived(!!shown?.some(isMe));

  function value(r: { value: number; solved?: number }): string {
    if (board === 'today') return r.value === 1 ? app.t('guesses.one') : app.t('guesses', { n: r.value });
    if (board === 'avg') return r.value.toFixed(2);
    return String(r.value);
  }

  async function submitNick(e: SubmitEvent) {
    e.preventDefault();
    if (localError || !nick.trim() || busy) return;
    busy = true;
    error = null;
    const r = editing ? await rename(nick) : await join(nick, app.today);
    busy = false;
    if (!r.ok) {
      error = r.error;
      return;
    }
    player = r.data;
    editing = false;
    nick = '';
    load();
  }

  async function onLeave() {
    if (!confirm(app.t('lb.leaveConfirm'))) return;
    busy = true;
    const r = await leave();
    busy = false;
    if (!r.ok) {
      error = r.error;
      return;
    }
    player = undefined;
    me = null;
    load();
  }

  const shownError = $derived(localError ?? error);
</script>

<Modal title={app.t('lb.title')} {onclose}>
  <div class="tabs" role="tablist">
    {#each BOARDS as b (b)}
      <button role="tab" aria-selected={board === b} class:active={board === b} onclick={() => (board = b)}>
        <span aria-hidden="true">{BOARD_ICON[b]}</span>
        {app.t(`lb.${b}`)}
      </button>
    {/each}
  </div>

  {#if perMode}
    <div class="filters">
      <select bind:value={mode} aria-label="Mode">
        {#each MODES as m (m)}<option value={m}>{app.t(`mode.${m}`)}</option>{/each}
      </select>
      <select bind:value={tier} aria-label="Difficulty">
        {#each TIERS as t (t)}<option value={t}>{app.t(`tier.${t}`)}</option>{/each}
      </select>
    </div>
  {/if}
  <p class="help">{app.t(`lb.${board}Help`, { n: AVG_MIN_SOLVES })}</p>

  <div class="board" aria-live="polite">
    {#if loadError}
      <p class="state">{app.t('lb.error')}</p>
    {:else if !rows}
      <p class="state">{app.t('lb.loading')}</p>
    {:else if !shown?.length}
      <p class="state">{app.t('lb.empty')}</p>
    {:else}
      <ol>
        {#each shown as r, i (i)}
          <li class:me={isMe(r)} class:podium={r.rank <= 3}>
            <span class="rank">{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</span>
            <span class="nick"><span>{r.nick}</span><small>#{r.tag}</small></span>
            <span class="val">
              {value(r)}
              {#if board === 'avg' && r.solved}<small>{app.t('lb.solves', { n: r.solved })}</small>{/if}
            </span>
          </li>
        {/each}
      </ol>
    {/if}
    {#if player && me && !meInRows}
      <div class="mine">
        <span class="rank">{me.rank ?? '–'}</span>
        <span class="nick"><span>{app.t('lb.you')}</span><small>#{player.tag}</small></span>
        <span class="val">
          {me.rank === null ? app.t('lb.notRanked') : value(me)}
          {#if board === 'avg' && me.solved}<small>{app.t('lb.solves', { n: me.solved })}</small>{/if}
        </span>
      </div>
    {/if}
  </div>

  <section class="account">
    {#if player && !editing}
      <p class="as">
        {app.t('lb.playingAs')} <strong>{player.nick}<small>#{player.tag}</small></strong>
      </p>
      <div class="row">
        <button class="btn small" onclick={() => ((editing = true), (nick = player!.nick), (error = null))} disabled={busy}>
          {app.t('lb.rename')}
        </button>
        <button class="link danger" onclick={onLeave} disabled={busy}>{app.t('lb.leave')}</button>
      </div>
    {:else}
      {#if !player}
        <h3>{app.t('lb.joinTitle')}</h3>
        <p class="help">{app.t('lb.joinHelp')}</p>
      {/if}
      <form class="row" onsubmit={submitNick}>
        <input
          bind:value={nick}
          maxlength={NICK_MAX + 8}
          placeholder={app.t('lb.nick')}
          aria-label={app.t('lb.nick')}
          aria-invalid={!!shownError}
          autocomplete="nickname"
          spellcheck="false"
        />
        <button class="btn primary" type="submit" disabled={busy || !nick.trim() || !!localError}>
          {editing ? app.t('lb.save') : app.t('lb.join')}
        </button>
        {#if editing}
          <button class="link" type="button" onclick={() => ((editing = false), (error = null))}>{app.t('lb.cancel')}</button>
        {/if}
      </form>
      {#if shownError}<p class="err" role="alert">{app.t(`lb.err.${shownError}`)}</p>{/if}
    {/if}
    <p class="fair">{app.t('lb.fair')}</p>
  </section>
</Modal>

<style>
  .tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin-bottom: 12px;
  }
  .tabs button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 4px;
    border-radius: 12px;
    border: 3px solid var(--ink);
    background: var(--panel-2);
    color: var(--muted);
    font: inherit;
    font-size: 0.78rem;
    font-weight: 900;
    box-shadow: var(--pop);
    cursor: pointer;
  }
  .tabs button span {
    font-size: 1.2rem;
  }
  .tabs button.active {
    background: var(--f-normal);
    color: var(--ink);
    transform: translateY(-2px);
  }
  .filters {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }
  select,
  input {
    padding: 8px 12px;
    border-radius: 12px;
    border: 3px solid var(--ink);
    background: var(--ink);
    color: var(--text);
    font: inherit;
    font-weight: 700;
    font-size: 0.9rem;
  }
  select {
    flex: 1;
  }
  .help {
    margin: 0 0 10px;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--muted);
  }
  .board {
    border: 3px solid var(--ink);
    border-radius: 14px;
    background: var(--ink);
    overflow: hidden;
  }
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 300px;
    overflow-y: auto;
  }
  li,
  .mine {
    display: grid;
    grid-template-columns: 2.2em 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 7px 12px;
    font-weight: 800;
    font-size: 0.92rem;
  }
  li:nth-child(even) {
    background: #ffffff08;
  }
  li.me,
  .mine {
    background: var(--f-spell);
    color: var(--ink);
  }
  .mine {
    border-top: 3px dashed var(--panel-2);
  }
  .rank {
    text-align: center;
    font-family: var(--font-title);
    font-size: 0.85rem;
  }
  .podium .rank {
    font-size: 1.15rem;
  }
  .nick {
    display: flex;
    align-items: baseline;
    min-width: 0;
  }
  .nick span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .nick small {
    flex-shrink: 0;
  }
  small {
    margin-left: 3px;
    font-size: 0.72rem;
    opacity: 0.65;
  }
  .val {
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .val small {
    display: block;
    margin: 0;
  }
  .state {
    margin: 0;
    padding: 22px 12px;
    text-align: center;
    color: var(--muted);
    font-weight: 700;
  }
  .account {
    margin-top: 16px;
  }
  h3 {
    font-family: var(--font-title);
    font-weight: 400;
    font-size: 1rem;
    margin: 0 0 6px;
  }
  .as {
    margin: 0 0 8px;
    font-weight: 700;
  }
  .row {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }
  .row input {
    flex: 1 1 160px;
    min-width: 0;
  }
  input[aria-invalid='true'] {
    border-color: var(--miss);
  }
  .danger {
    color: var(--miss);
  }
  .err {
    margin: 8px 0 0;
    color: var(--miss);
    font-weight: 800;
    font-size: 0.85rem;
  }
  .fair {
    margin: 12px 0 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted);
  }
  @media (max-width: 420px) {
    .tabs button {
      font-size: 0.66rem;
    }
  }
</style>
