<script lang="ts">
  import { app } from '../lib/app.svelte.ts';
  import { LANG_LABELS } from '../lib/i18n/index.ts';
  import { LANGS, MODES, TIERS, type Lang } from '../lib/types.ts';

  let { onhelp, onstats }: { onhelp: () => void; onstats: () => void } = $props();

  // Each mode wears a card-frame colour: Effect orange, Fusion violet, Spell teal.
  const MODE_COLOR = { classic: 'var(--f-effect)', artwork: 'var(--f-fusion)', text: 'var(--f-spell)' } as const;
  const MODE_ICON = { classic: '🃏', artwork: '🖼️', text: '📜' } as const;
  const TIER_COLOR = { easy: 'var(--f-normal)', normal: 'var(--f-effect)', hard: 'var(--f-trap)' } as const;
</script>

<header>
  <div class="top">
    <button class="icon" onclick={onhelp} aria-label={app.t('btn.help')} title={app.t('btn.help')}>?</button>
    <h1><img class="logo" src="/brand/logo.webp" alt="Yugidle" width="480" height="189" /></h1>
    <div class="right">
      <button class="icon" onclick={onstats} aria-label={app.t('btn.stats')} title={app.t('btn.stats')}>📊</button>
      <select
        class="icon lang"
        aria-label={app.t('lang')}
        value={app.settings.lang}
        onchange={(e) => app.setLang(e.currentTarget.value as Lang)}
      >
        {#each LANGS as l (l)}
          <option value={l} title={LANG_LABELS[l]}>{l.toUpperCase()}</option>
        {/each}
      </select>
    </div>
  </div>

  <nav class="modes" aria-label="Mode">
    {#each MODES as m (m)}
      <button
        class:active={app.settings.mode === m}
        style:--c={MODE_COLOR[m]}
        aria-pressed={app.settings.mode === m}
        onclick={() => app.update({ mode: m })}
      >
        <span class="emoji" aria-hidden="true">{MODE_ICON[m]}</span>
        {app.t(`mode.${m}`)}
      </button>
    {/each}
  </nav>

  <div class="options">
    <div class="seg" role="group" aria-label="Difficulty">
      {#each TIERS as t (t)}
        <button
          class:active={app.settings.tier === t}
          style:--c={TIER_COLOR[t]}
          aria-pressed={app.settings.tier === t}
          onclick={() => app.update({ tier: t })}
        >
          {app.t(`tier.${t}`)}
        </button>
      {/each}
    </div>
    <div class="seg" role="group" aria-label="Play">
      {#each ['daily', 'unlimited'] as const as p (p)}
        <button
          class:active={app.settings.play === p}
          style:--c="var(--f-synchro)"
          aria-pressed={app.settings.play === p}
          onclick={() => app.update({ play: p })}
        >
          {app.t(`play.${p}`)}
        </button>
      {/each}
    </div>
  </div>
</header>

<style>
  header {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }
  .top {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
  }
  .right {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    align-items: center;
  }

  h1 {
    margin: 0;
    line-height: 0;
  }
  .logo {
    display: block;
    width: clamp(190px, 40vw, 440px);
    height: auto;
    filter: drop-shadow(0 8px 18px #0c0720cc);
    animation: drop 0.7s cubic-bezier(0.3, 1.5, 0.5, 1) backwards;
  }
  @keyframes drop {
    from {
      transform: translateY(-40px) scale(0.7) rotate(-4deg);
      opacity: 0;
    }
  }

  .lang {
    width: auto;
    padding: 0 6px;
    font-size: 0.8rem;
    appearance: none;
    text-align: center;
  }

  .modes {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .modes button {
    font-family: var(--font-title);
    font-size: 0.95rem;
    padding: 10px 16px;
    border-radius: 14px;
    border: 3px solid var(--ink);
    background: var(--panel);
    color: var(--muted);
    box-shadow: 0 4px 0 var(--ink);
    cursor: pointer;
    display: flex;
    gap: 8px;
    align-items: center;
    transition:
      transform 0.12s cubic-bezier(0.3, 1.6, 0.5, 1),
      background 0.15s,
      color 0.15s;
  }
  .modes button:hover {
    color: var(--text);
  }
  .modes button.active {
    background: var(--c);
    color: var(--ink);
    transform: translateY(-3px) rotate(-1.5deg);
    box-shadow: 0 7px 0 var(--ink);
  }
  .emoji {
    font-size: 1.1rem;
  }

  .options {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .seg {
    display: flex;
    border: 3px solid var(--ink);
    border-radius: 999px;
    overflow: hidden;
    background: var(--panel);
    box-shadow: 0 3px 0 var(--ink);
  }
  .seg button {
    font-weight: 800;
    font-size: 0.85rem;
    padding: 6px 14px;
    border: 0;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
  }
  .seg button + button {
    border-left: 2px solid var(--ink);
  }
  .seg button.active {
    background: var(--c);
    color: var(--ink);
  }

  @media (max-width: 520px) {
    .modes {
      gap: 6px;
    }
    .modes button {
      font-size: 0.74rem;
      padding: 8px 9px;
      gap: 5px;
    }
    .emoji {
      display: none;
    }
    .icon {
      width: 36px;
      height: 36px;
    }
  }
</style>
