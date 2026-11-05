<script lang="ts">
  import { app } from '../lib/app.svelte.ts';
  import { BUCKETS, currentStreak, exportBackup, gameKey, getStats, importBackup } from '../lib/storage.ts';
  import Modal from './Modal.svelte';

  let { onclose }: { onclose: () => void } = $props();

  const { mode, tier } = app.settings;
  const s = getStats(gameKey('daily', mode, tier));
  const max = Math.max(1, ...s.dist);
  const avg = s.wins ? (s.totalGuesses / s.wins).toFixed(1) : '–';

  let copied = $state(false);
  let code = $state('');
  let invalid = $state(false);

  async function copyBackup() {
    try {
      await navigator.clipboard.writeText(exportBackup());
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      code = exportBackup(); // clipboard blocked: show the code so it can be copied by hand
    }
  }

  function restore() {
    invalid = false;
    if (!code.trim() || !confirm(app.t('backup.confirm'))) return;
    if (importBackup(code)) location.reload();
    else invalid = true;
  }
</script>

<Modal title={app.t('stats.title')} {onclose}>
  <div class="day">
    <span class="flame" aria-hidden="true">🔥</span>
    <div>
      <strong>{app.streak}</strong>
      <span class="label">{app.t('stats.dayStreak')}</span>
      <span class="sub">{app.t('stats.dayStreakHelp')} · {app.t('stats.maxStreak')}: {app.dayStreak.maxStreak}</span>
    </div>
  </div>
  <p class="scope">
    {app.t('stats.scope', { mode: app.t(`mode.${mode}`), tier: app.t(`tier.${tier}`) })}
  </p>
  <div class="tiles">
    <div><strong>{s.wins}</strong><span>{app.t('stats.wins')}</span></div>
    <div><strong>{avg}</strong><span>{app.t('stats.avg')}</span></div>
    <div><strong>{currentStreak(s, app.today)}</strong><span>{app.t('stats.streak')}</span></div>
    <div><strong>{s.maxStreak}</strong><span>{app.t('stats.maxStreak')}</span></div>
  </div>
  <h3>{app.t('stats.dist')}</h3>
  <div class="dist">
    {#each BUCKETS as b, i (b)}
      <span class="b">{b}</span>
      <span class="bar" style:width="{Math.max(6, (s.dist[i] / max) * 100)}%">{s.dist[i]}</span>
    {/each}
  </div>

  <h3>{app.t('backup.title')}</h3>
  <p class="help">{app.t('backup.help')}</p>
  <div class="backup">
    <button class="btn" onclick={copyBackup}>{copied ? app.t('backup.copied') : app.t('backup.copy')}</button>
    <input
      bind:value={code}
      placeholder={app.t('backup.placeholder')}
      aria-label={app.t('backup.placeholder')}
      spellcheck="false"
      autocomplete="off"
    />
    <button class="btn" onclick={restore} disabled={!code.trim()}>{app.t('backup.restore')}</button>
  </div>
  {#if invalid}<p class="err" role="alert">{app.t('backup.invalid')}</p>{/if}
</Modal>

<style>
  .day {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    margin-bottom: 18px;
    border: 3px solid var(--ink);
    border-radius: 16px;
    background: var(--panel-2);
    box-shadow: var(--pop);
  }
  .flame {
    font-size: 2.4rem;
    line-height: 1;
  }
  .day div {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 10px;
    align-items: baseline;
  }
  .day strong {
    color: var(--f-effect);
    text-shadow: 2px 2px 0 var(--ink);
  }
  .label {
    font-weight: 900;
  }
  .sub {
    grid-column: 1 / -1;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--muted);
  }
  .help {
    margin: 0 0 10px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--muted);
  }
  .backup {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .backup input {
    flex: 1 1 160px;
    min-width: 0;
    padding: 8px 12px;
    border-radius: 12px;
    border: 3px solid var(--ink);
    background: var(--ink);
    color: var(--text);
    font: inherit;
    font-size: 0.85rem;
  }
  .err {
    margin: 8px 0 0;
    color: var(--miss);
    font-weight: 800;
    font-size: 0.85rem;
  }
  .scope {
    margin: -6px 0 16px;
    color: var(--muted);
    font-size: 0.9rem;
    font-weight: 700;
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }
  .tiles div {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 4px;
    border-radius: 14px;
    border: 3px solid var(--ink);
    box-shadow: 0 4px 0 var(--ink);
    color: var(--ink);
  }
  .tiles div:nth-child(1) {
    background: var(--f-normal);
  }
  .tiles div:nth-child(2) {
    background: var(--f-effect);
  }
  .tiles div:nth-child(3) {
    background: var(--f-spell);
  }
  .tiles div:nth-child(4) {
    background: var(--f-trap);
  }
  strong {
    font-family: var(--font-title);
    font-weight: 400;
    font-size: 1.7rem;
    font-variant-numeric: tabular-nums;
  }
  .tiles span {
    font-size: 0.75rem;
    font-weight: 800;
    text-align: center;
  }
  h3 {
    font-family: var(--font-title);
    font-weight: 400;
    font-size: 1rem;
    margin: 22px 0 10px;
  }
  .dist {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px 10px;
    align-items: center;
  }
  .b {
    font-size: 0.85rem;
    font-weight: 800;
    color: var(--muted);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .bar {
    background: var(--f-ritual);
    border: 2px solid var(--ink);
    border-radius: 8px;
    padding: 1px 8px;
    font-size: 0.85rem;
    font-weight: 900;
    text-align: right;
    min-width: 28px;
    animation: grow 0.6s cubic-bezier(0.3, 1.3, 0.5, 1) backwards;
    transform-origin: left;
  }
  @keyframes grow {
    from {
      transform: scaleX(0);
    }
  }
</style>
