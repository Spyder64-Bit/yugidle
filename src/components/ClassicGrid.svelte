<script lang="ts">
  import { app } from '../lib/app.svelte.ts';
  import { COLUMNS, compareMonsters, type Column } from '../lib/compare.ts';
  import type { Frame, Monster } from '../lib/types.ts';
  import Thumb from './Thumb.svelte';

  let { guesses, answer, animateId }: { guesses: Monster[]; answer: Monster; animateId: number | null } =
    $props();

  const rows = $derived([...guesses].reverse().map((g) => ({ m: g, row: compareMonsters(g, answer) })));

  const KIND_ICON = { level: '★', rank: '✦', link: '⬡' } as const;
  // Like the in-game ban-list badges: forbidden sign, 1 or 2 copies, unlimited.
  const BAN_ICON = ['⛔', '①', '②', '∞'] as const;

  // Real card-frame colours, so the tags read like the cards themselves.
  const FRAME_COLOR: Record<Frame, string> = {
    effect: 'var(--f-effect)',
    'non-effect': 'var(--f-normal)',
    pendulum: 'var(--f-pendulum)',
    link: 'var(--f-link)',
    ritual: 'var(--f-ritual)',
    fusion: 'var(--f-fusion)',
    xyz: 'var(--f-xyz)',
    synchro: 'var(--f-synchro)',
  };

  function value(m: Monster, c: Column): string {
    const T = app.terms;
    switch (c) {
      case 'frame':
        return '';
      case 'race':
        return T.race[m.race] ?? m.race;
      case 'ability':
        return m.ability.length ? m.ability.map((a) => T.ability[a]).join(', ') : app.t('none');
      case 'attr':
        return T.attr[m.attr as keyof typeof T.attr] ?? m.attr;
      case 'level':
        return `${KIND_ICON[m.lk]} ${m.lv}`;
      case 'atk':
        return String(m.atk);
      case 'def':
        return m.def === null ? '—' : String(m.def);
      case 'year':
        return m.year === null ? '?' : String(m.year);
      case 'ban':
        return `${BAN_ICON[m.ban]} ${app.t(`ban.${m.ban}`)}`;
    }
  }

  const title = (m: Monster, c: Column) => (c === 'level' ? `${app.t(`kind.${m.lk}`)} ${m.lv}` : undefined);
</script>

<div class="scroller">
  <div class="grid" role="table">
    <div class="row head" role="row">
      <div role="columnheader">{app.t('col.name')}</div>
      {#each COLUMNS as c (c)}
        <div role="columnheader">{app.t(`col.${c}`)}</div>
      {/each}
    </div>
    {#each rows as { m, row } (m.id)}
      <div class="row" role="row" class:animate={m.id === animateId}>
        <div class="name" role="cell">
          <Thumb img={m.img} size={46} />
          <span>{app.name(m)}</span>
        </div>
        {#each COLUMNS as c, i (c)}
          <div role="cell" class="cell {row[c].status}" style:--delay="{i * 90}ms" title={title(m, c)}>
            {#if c === 'frame'}
              <span class="tags">
                {#each m.frame as f (f)}
                  <span class="tag"><i style:background={FRAME_COLOR[f]}></i>{app.terms.frame[f]}</span>
                {/each}
              </span>
            {:else}
              <span class="v">{value(m, c)}</span>
            {/if}
            {#if row[c].arrow}
              <span class="arrow" aria-label={row[c].arrow === 'up' ? 'higher' : 'lower'}
                >{row[c].arrow === 'up' ? '▲' : '▼'}</span
              >
            {/if}
          </div>
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
  .scroller {
    width: 100%;
    overflow-x: auto;
    padding: 4px 8px 12px 2px;
  }
  .grid {
    min-width: 990px;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .row {
    display: grid;
    grid-template-columns: 1.7fr 1.2fr 1fr 0.9fr 0.9fr 0.85fr 0.75fr 0.75fr 0.7fr 1fr;
    gap: 7px;
  }
  .head > div {
    font-size: 0.8rem;
    font-weight: 800;
    color: var(--muted);
    text-align: center;
    padding-bottom: 2px;
    text-shadow: 0 1px 3px var(--ink), 0 0 8px var(--ink);
  }
  .name {
    position: sticky;
    left: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 6px 8px 6px 6px;
    background: var(--panel);
    border: 3px solid var(--ink);
    border-radius: 12px;
    box-shadow: 0 4px 0 var(--ink);
    font-size: 0.86rem;
    font-weight: 800;
    line-height: 1.15;
  }
  .cell {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 62px;
    padding: 5px;
    border-radius: 12px;
    border: 3px solid var(--ink);
    box-shadow: 0 4px 0 var(--ink);
    font-size: 0.86rem;
    font-weight: 800;
    line-height: 1.15;
    overflow: hidden;
  }
  .hit {
    background: var(--hit);
    color: var(--ink);
  }
  .partial {
    background: var(--partial);
    color: var(--ink);
  }
  .miss {
    background: var(--miss);
    color: #fff;
  }
  /* Glossy top edge, like a sticker. */
  .cell::before {
    content: '';
    position: absolute;
    inset: 0 0 55% 0;
    background: linear-gradient(#ffffff40, #ffffff00);
    pointer-events: none;
  }
  .tags {
    display: flex;
    flex-direction: column;
    gap: 2px;
    align-items: flex-start;
    position: relative;
    z-index: 1;
  }
  .tag {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.8rem;
  }
  .tag i {
    width: 11px;
    height: 11px;
    border-radius: 3px;
    border: 2px solid var(--ink);
    flex: none;
  }
  .arrow {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.9rem;
    color: #0c072040;
    pointer-events: none;
  }
  .v {
    position: relative;
    z-index: 1;
  }
  .animate .cell {
    animation: flip 0.55s cubic-bezier(0.3, 1.4, 0.5, 1) backwards;
    animation-delay: var(--delay);
  }
  .animate .name {
    animation: slam 0.35s cubic-bezier(0.3, 1.6, 0.5, 1) backwards;
  }
  .animate .cell.hit {
    animation:
      flip 0.55s cubic-bezier(0.3, 1.4, 0.5, 1) backwards var(--delay),
      glow 0.9s ease-out calc(var(--delay) + 0.5s);
  }
  @keyframes flip {
    from {
      transform: perspective(400px) rotateX(-100deg) scale(0.8);
      opacity: 0;
    }
  }
  @keyframes slam {
    from {
      transform: scale(1.3) rotate(-4deg);
      opacity: 0;
    }
  }
  @keyframes glow {
    40% {
      box-shadow:
        0 4px 0 var(--ink),
        0 0 0 6px #2bd47d66;
    }
  }
</style>
