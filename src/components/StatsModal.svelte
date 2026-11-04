<script lang="ts">
  import { app } from '../lib/app.svelte.ts';
  import { BUCKETS, currentStreak, gameKey, getStats } from '../lib/storage.ts';
  import Modal from './Modal.svelte';

  let { onclose }: { onclose: () => void } = $props();

  const { mode, tier } = app.settings;
  const s = getStats(gameKey('daily', mode, tier));
  const max = Math.max(1, ...s.dist);
  const avg = s.wins ? (s.totalGuesses / s.wins).toFixed(1) : '–';
</script>

<Modal title={app.t('stats.title')} {onclose}>
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
</Modal>

<style>
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
