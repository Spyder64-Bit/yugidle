<script lang="ts">
  import { untrack } from 'svelte';
  import { app } from '../lib/app.svelte.ts';
  import { compareMonsters } from '../lib/compare.ts';
  import { dailyAnswer, randomAnswer } from '../lib/daily.ts';
  import { classicGrid, simpleGrid } from '../lib/share.ts';
  import { gameKey, getGame, recordWin, saveGame, type GameState } from '../lib/storage.ts';
  import type { Monster } from '../lib/types.ts';
  import ArtworkClue from './ArtworkClue.svelte';
  import ClassicGrid from './ClassicGrid.svelte';
  import GuessInput from './GuessInput.svelte';
  import Hints from './Hints.svelte';
  import TextClue from './TextClue.svelte';
  import Thumb from './Thumb.svelte';
  import WinPanel from './WinPanel.svelte';

  // Game.svelte is re-mounted (via {#key}) whenever mode/tier/play changes.
  const { mode, tier, play } = untrack(() => app.settings);
  const key = gameKey(play, mode, tier);
  const daily = play === 'daily';

  function fresh(): GameState {
    if (daily) {
      const day = app.today;
      return { answer: dailyAnswer(app.schedule!, app.monsters, mode, tier, day), guesses: [], done: false, day };
    }
    return { answer: randomAnswer(app.monsters, tier, getGame(key)?.answer), guesses: [], done: false, day: null };
  }

  function initial(): GameState {
    const saved = getGame(key);
    if (!saved || !app.byId.has(saved.answer)) return fresh();
    if (daily && saved.day !== app.today) return fresh();
    return { ...saved, guesses: saved.guesses.filter((id) => app.byId.has(id)) };
  }

  let game = $state<GameState>(untrack(initial));
  let animateId = $state<number | null>(null);

  // Daily rollover while the page is open.
  $effect(() => {
    if (daily && app.today !== untrack(() => game.day)) {
      game = fresh();
      saveGame(key, game);
    }
  });

  const answer = $derived(app.byId.get(game.answer)!);
  const guessed = $derived(game.guesses.map((id) => app.byId.get(id)!));
  const exclude = $derived(new Set(game.guesses));
  const wrong = $derived(game.guesses.filter((id) => id !== game.answer).length);

  function guess(id: number) {
    if (game.done || exclude.has(id)) return;
    game.guesses.push(id);
    animateId = id;
    if (id === game.answer) {
      game.done = true;
      recordWin(key, game.guesses.length, game.day);
    }
    saveGame(key, $state.snapshot(game));
  }

  function giveUp() {
    game.done = true;
    game.gaveUp = true;
    saveGame(key, $state.snapshot(game));
  }

  function again() {
    game = fresh();
    animateId = null;
    saveGame(key, game);
  }

  function shareText(): string {
    const title = [
      'Yugidle',
      daily ? app.t('puzzle', { n: (game.day ?? 0) + 1 }) : `(${app.t('play.unlimited')})`,
      '·',
      app.t(`mode.${mode}`),
      `(${app.t(`tier.${tier}`)})`,
    ].join(' ');
    const n = game.guesses.length;
    const count = n === 1 ? app.t('guesses.one') : app.t('guesses', { n });
    const grid =
      mode === 'classic'
        ? classicGrid(guessed.map((g) => compareMonsters(g, answer)))
        : simpleGrid(n);
    return `${title}\n${count}\n${grid}\n${location.origin}`;
  }

  const wrongList = $derived([...guessed].reverse().filter((m: Monster) => m.id !== game.answer));
</script>

<section class="game">
  <p class="prompt">
    {app.t(`prompt.${mode}`)}
    {#if daily}<span class="num">{app.t('puzzle', { n: (game.day ?? 0) + 1 })}</span>{/if}
  </p>

  {#if mode === 'artwork'}
    <ArtworkClue {answer} {wrong} done={game.done} seed="{key}:{game.day ?? game.answer}" />
  {:else if mode === 'text'}
    <TextClue {answer} {wrong} done={game.done} />
  {/if}

  {#if game.done}
    <WinPanel
      {answer}
      count={game.guesses.length}
      gaveUp={!!game.gaveUp}
      {daily}
      {shareText}
      onagain={again}
      justFinished={animateId !== null || !!game.gaveUp}
    />
  {:else}
    <div class="input-row">
      <GuessInput {exclude} onguess={guess} />
    </div>
    <div class="meta">
      <span>{game.guesses.length === 1 ? app.t('guesses.one') : app.t('guesses', { n: game.guesses.length })}</span>
      {#if !daily && game.guesses.length > 0}
        <button class="link" onclick={giveUp}>{app.t('btn.giveUp')}</button>
      {/if}
    </div>
    {#if mode === 'classic'}
      <Hints {answer} count={game.guesses.length} done={game.done} />
    {/if}
  {/if}

  {#if mode === 'classic'}
    {#if guessed.length}
      <ClassicGrid guesses={guessed} {answer} {animateId} />
    {/if}
  {:else if wrongList.length}
    <ul class="wrong">
      {#each wrongList as m (m.id)}
        <li class:animate={m.id === animateId}><Thumb img={m.img} size={32} /> {app.name(m)}</li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .game {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .prompt {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    text-align: center;
    margin: 0;
    font-size: 1.2rem;
    font-weight: 900;
    text-shadow: 0 2px 0 var(--ink);
  }
  .num {
    font-family: var(--font-title);
    font-weight: 400;
    font-size: 0.95rem;
    background: var(--f-trap);
    color: #fff;
    border: 3px solid var(--ink);
    border-radius: 10px;
    padding: 2px 10px;
    box-shadow: 0 3px 0 var(--ink);
    transform: rotate(3deg);
    text-shadow: none;
  }
  .input-row {
    max-width: 580px;
    width: 100%;
    margin: 0 auto;
  }
  .meta {
    display: flex;
    justify-content: center;
    gap: 16px;
    color: var(--muted);
    font-size: 0.9rem;
    font-weight: 800;
    margin-top: -4px;
    text-shadow: 0 1px 3px var(--ink), 0 0 8px var(--ink);
  }
  .wrong {
    list-style: none;
    padding: 0;
    margin: 0 auto;
    width: 100%;
    max-width: 580px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .wrong li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 12px 6px 6px;
    border-radius: 12px;
    background: var(--miss);
    border: 3px solid var(--ink);
    box-shadow: 0 4px 0 var(--ink);
    font-weight: 800;
  }
  .wrong li.animate {
    animation: shake 0.45s;
  }
  @keyframes shake {
    20% {
      transform: translateX(-8px) rotate(-1deg);
    }
    50% {
      transform: translateX(7px) rotate(1deg);
    }
    80% {
      transform: translateX(-3px);
    }
  }
</style>
