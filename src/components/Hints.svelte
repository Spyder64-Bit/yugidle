<script lang="ts">
  import { app } from '../lib/app.svelte.ts';
  import { artUrl } from '../lib/data.ts';
  import type { Monster } from '../lib/types.ts';

  let { answer, count, done }: { answer: Monster; count: number; done: boolean } = $props();

  const HINTS = [
    { id: 'arch', at: 6, label: 'hint.archetype' },
    { id: 'art', at: 10, label: 'hint.art' },
  ] as const;

  let revealed = $state<Record<string, boolean>>({});
</script>

<div class="hints">
  {#each HINTS as h (h.id)}
    {@const left = h.at - count}
    <div class="hint">
      <div class="label">{app.t(h.label)}</div>
      {#if revealed[h.id] || done}
        {#if h.id === 'arch'}
          <div class="value">{answer.arch ?? app.t('hint.noArchetype')}</div>
        {:else}
          <img class="blur" class:clear={done} src={artUrl(answer.img)} alt="" />
        {/if}
      {:else if left > 0}
        <div class="locked">🔒 {left === 1 ? app.t('hint.lockedOne') : app.t('hint.locked', { n: left })}</div>
      {:else}
        <button class="btn small" onclick={() => (revealed[h.id] = true)}>{app.t('hint.show')}</button>
      {/if}
    </div>
  {/each}
</div>

<style>
  .hints {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .hint {
    flex: 1 1 140px;
    max-width: 280px;
    background: var(--panel);
    border: 3px dashed var(--muted);
    border-radius: 14px;
    padding: 10px 12px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .label {
    font-family: var(--font-title);
    font-size: 0.8rem;
    color: var(--f-normal);
  }
  .locked {
    color: var(--muted);
    font-size: 0.85rem;
    font-weight: 700;
  }
  .value {
    font-weight: 900;
    font-size: 1.05rem;
    background: var(--f-normal);
    color: var(--ink);
    border: 2px solid var(--ink);
    border-radius: 8px;
    padding: 2px 10px;
    animation: reveal 0.4s cubic-bezier(0.3, 1.6, 0.5, 1);
  }
  .blur {
    width: 110px;
    height: 110px;
    object-fit: cover;
    border-radius: 10px;
    border: 3px solid var(--ink);
    filter: blur(9px) saturate(1.3);
    transition: filter 0.6s;
    animation: reveal 0.4s cubic-bezier(0.3, 1.6, 0.5, 1);
  }
  .blur.clear {
    filter: none;
  }
  @keyframes reveal {
    from {
      transform: scale(0.6);
      opacity: 0;
    }
  }
</style>
