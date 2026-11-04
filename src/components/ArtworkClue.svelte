<script lang="ts">
  import { app } from '../lib/app.svelte.ts';
  import { artUrl } from '../lib/data.ts';
  import { seeded } from '../lib/rng.ts';
  import type { Monster } from '../lib/types.ts';

  let { answer, wrong, done, seed }: { answer: Monster; wrong: number; done: boolean; seed: string } =
    $props();

  const origin = $derived.by(() => {
    const r = seeded(`art:${seed}`);
    return { x: 20 + r() * 60, y: 20 + r() * 60 };
  });
  const scale = $derived(done ? 1 : Math.max(1, 5 * Math.pow(0.82, wrong)));
  const gray = $derived(app.settings.grayscale && !done);
  let failed = $state(false);
</script>

<div class="frame">
  <div class="art">
    {#if !failed}
      <img
        src={artUrl(answer.img)}
        alt=""
        draggable="false"
        style:transform="scale({scale})"
        style:transform-origin="{origin.x}% {origin.y}%"
        class:gray
        onerror={() => (failed = true)}
      />
    {:else}
      <div class="missing">🖼️</div>
    {/if}
  </div>
</div>
<label class="toggle">
  <input
    type="checkbox"
    checked={app.settings.grayscale}
    onchange={(e) => app.update({ grayscale: e.currentTarget.checked })}
  />
  {app.t('art.grayscale')}
</label>

<style>
  .frame {
    padding: 12px;
    border-radius: 20px;
    background: var(--f-fusion);
    border: 3px solid var(--ink);
    box-shadow: 8px 8px 0 var(--ink);
    width: min(360px, 84vw);
    margin: 0 auto;
    transform: rotate(-1.5deg);
  }
  .art {
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 10px;
    background: var(--ink);
    border: 3px solid var(--ink);
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    user-select: none;
    transition:
      transform 0.7s cubic-bezier(0.3, 1.3, 0.5, 1),
      filter 0.6s ease;
  }
  img.gray {
    filter: grayscale(1) contrast(1.1);
  }
  .missing {
    display: grid;
    place-items: center;
    height: 100%;
    font-size: 3rem;
  }
  .toggle {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
    margin-top: 14px;
    font-size: 0.9rem;
    font-weight: 800;
    color: var(--muted);
    cursor: pointer;
  }
  .toggle input {
    accent-color: var(--f-fusion);
    width: 18px;
    height: 18px;
  }
</style>
