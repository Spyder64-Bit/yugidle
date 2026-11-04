<script lang="ts">
  import { app } from '../lib/app.svelte.ts';
  import { formatCountdown, msUntilNextDay } from '../lib/daily.ts';
  import { artUrl } from '../lib/data.ts';
  import { MODES, type Monster } from '../lib/types.ts';
  import Confetti from './Confetti.svelte';

  let {
    answer,
    count,
    gaveUp,
    daily,
    shareText,
    onagain,
    justFinished,
  }: {
    answer: Monster;
    count: number;
    gaveUp: boolean;
    daily: boolean;
    shareText: () => string;
    onagain: () => void;
    justFinished: boolean;
  } = $props();

  let copied = $state(false);
  let el: HTMLElement;

  $effect(() => {
    if (justFinished) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  async function share() {
    const text = shareText();
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      /* user cancelled */
    }
  }

  const n = $derived(count === 1 ? app.t('guesses.one') : app.t('guesses', { n: count }));
  const otherModes = $derived(MODES.filter((m) => m !== app.settings.mode));
</script>

{#if justFinished && !gaveUp}<Confetti />{/if}

<section class="win" class:gaveup={gaveUp} bind:this={el}>
  <div class="art" class:shine={justFinished}><img src={artUrl(answer.img)} alt="" /></div>
  <div class="body">
    {#if gaveUp}
      <h2>{app.t('gaveUp.title')}</h2>
      <p class="answer">{app.name(answer)}</p>
    {:else}
      <h2>{app.t('win.title')}</h2>
      <p>{app.t('win.body', { name: app.name(answer), n })}</p>
    {/if}

    <div class="actions">
      {#if !gaveUp}
        <button class="btn primary" onclick={share}>{copied ? app.t('win.copied') : app.t('win.share')}</button>
      {/if}
      {#if !daily}
        <button class="btn" onclick={onagain}>{app.t('win.again')}</button>
      {/if}
    </div>

    {#if daily}
      <p class="next">{app.t('win.next')} <strong>{formatCountdown(msUntilNextDay(app.now))}</strong></p>
    {/if}

    <div class="others">
      <span>{app.t('win.otherModes')}</span>
      {#each otherModes as m (m)}
        <button class="btn small" onclick={() => app.update({ mode: m })}>{app.t(`mode.${m}`)}</button>
      {/each}
    </div>
  </div>
</section>

<style>
  .win {
    position: relative;
    display: flex;
    gap: 22px;
    align-items: center;
    background: var(--hit);
    color: var(--ink);
    border: 3px solid var(--ink);
    border-radius: 20px;
    padding: 18px 20px;
    box-shadow: 8px 8px 0 var(--ink);
    animation: pop 0.55s cubic-bezier(0.3, 1.6, 0.5, 1);
    overflow: hidden;
  }
  /* Halftone dots: a comic-panel finish on the result card. */
  .win::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(#0c072022 1.5px, transparent 1.6px);
    background-size: 12px 12px;
    pointer-events: none;
  }
  .win.gaveup {
    background: var(--miss);
    color: #fff;
  }
  .art {
    position: relative;
    flex: none;
    width: 140px;
    height: 140px;
    border-radius: 14px;
    border: 4px solid var(--ink);
    overflow: hidden;
    transform: rotate(-4deg);
    box-shadow: 5px 5px 0 var(--ink);
    background: var(--ink);
  }
  .art img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  /* A single holographic sweep across the art when you win. */
  .art.shine::after {
    content: '';
    position: absolute;
    inset: -50%;
    background: linear-gradient(
      115deg,
      transparent 40%,
      #ffffff10 44%,
      #ff9de6aa 48%,
      #9debffaa 51%,
      #fff59daa 54%,
      transparent 60%
    );
    mix-blend-mode: screen;
    animation: holo 1.4s ease-out 0.4s backwards;
    transform: translateX(120%);
  }
  @keyframes holo {
    from {
      transform: translateX(-80%);
    }
    to {
      transform: translateX(120%);
    }
  }
  .body {
    position: relative;
    flex: 1;
    min-width: 0;
  }
  h2 {
    margin: 0 0 4px;
    font-family: var(--font-title);
    font-weight: 400;
    font-size: 1.8rem;
    line-height: 1.1;
  }
  p {
    margin: 0 0 12px;
    font-weight: 700;
  }
  .answer {
    font-family: var(--font-title);
    font-size: 1.3rem;
  }
  .actions,
  .others {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }
  .next {
    margin: 14px 0 6px;
  }
  .next strong {
    font-family: var(--font-title);
    font-weight: 400;
    font-variant-numeric: tabular-nums;
    background: var(--ink);
    color: var(--f-normal);
    padding: 2px 8px;
    border-radius: 8px;
    margin-left: 4px;
  }
  .others {
    margin-top: 8px;
    font-size: 0.85rem;
    font-weight: 800;
  }
  @media (max-width: 560px) {
    .win {
      flex-direction: column;
      text-align: center;
    }
    .actions,
    .others {
      justify-content: center;
    }
  }
  @keyframes pop {
    from {
      transform: scale(0.85) rotate(-2deg);
      opacity: 0;
    }
  }
</style>
