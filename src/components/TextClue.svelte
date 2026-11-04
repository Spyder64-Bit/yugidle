<script lang="ts">
  import { app } from '../lib/app.svelte.ts';
  import { loadText } from '../lib/data.ts';
  import { redact, splitClues } from '../lib/redact.ts';
  import type { Monster } from '../lib/types.ts';

  let { answer, wrong, done }: { answer: Monster; wrong: number; done: boolean } = $props();

  let clues = $state<string[]>([]);

  $effect(() => {
    const lang = app.settings.lang;
    const names = [app.name(answer), answer.name];
    let cancelled = false;
    loadText(lang, answer.id).then((text) => {
      if (!cancelled) clues = splitClues(redact(text, names));
    });
    return () => (cancelled = true);
  });

  const shown = $derived(done ? clues.length : Math.min(clues.length, 1 + wrong));
  const typeline = $derived(
    [app.terms.race[answer.race] ?? answer.race, ...answer.frame.map((f) => app.terms.frame[f])].join(' / '),
  );
</script>

<div class="card">
  {#if wrong >= 5 || done}
    <div class="typeline">[{typeline}]</div>
  {/if}
  <div class="text">
    {#each clues.slice(0, shown) as c, i (i)}
      <p class="clue">{c}</p>
    {/each}
    {#if shown < clues.length}
      <p class="more">{'▒'.repeat(18)} …</p>
    {/if}
  </div>
</div>
{#if !done && shown < clues.length}
  <p class="note">{app.t('text.more')}</p>
{/if}

<style>
  .card {
    position: relative;
    background: #f3ead2;
    color: #1d1405;
    border-radius: 16px;
    border: 3px solid var(--ink);
    box-shadow: 8px 8px 0 var(--ink);
    padding: 18px 20px 16px;
    max-width: 640px;
    margin: 0 auto;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.55;
    outline: 8px solid var(--f-spell);
    outline-offset: -14px;
  }
  .typeline {
    font-weight: 900;
    margin-bottom: 6px;
  }
  .clue {
    margin: 0 0 6px;
    animation: ink 0.5s ease-out;
  }
  .more {
    margin: 0;
    color: #1d140555;
    letter-spacing: 0.1em;
  }
  .note {
    text-align: center;
    color: var(--muted);
    font-size: 0.85rem;
    font-weight: 700;
  }
  @keyframes ink {
    from {
      opacity: 0;
      clip-path: inset(0 100% 0 0);
    }
    to {
      clip-path: inset(0 0 0 0);
    }
  }
</style>
