<script lang="ts">
  import { app } from './lib/app.svelte.ts';
  import Game from './components/Game.svelte';
  import Header from './components/Header.svelte';
  import MonsterWall from './components/MonsterWall.svelte';
  import HelpModal from './components/HelpModal.svelte';
  import StatsModal from './components/StatsModal.svelte';
  import LeaderboardModal from './components/LeaderboardModal.svelte';
  import PrivacyModal from './components/PrivacyModal.svelte';
  import { KOFI_URL, REPO_URL } from './lib/config.ts';

  let modal = $state<'help' | 'stats' | 'leaderboard' | 'privacy' | null>(null);

  app.init().then(() => {
    if (!app.settings.seenHelp) {
      modal = 'help';
      app.update({ seenHelp: true });
    }
  });

  const gameId = $derived(`${app.settings.play}:${app.settings.mode}:${app.settings.tier}`);
</script>

<MonsterWall />

<div class="page">
  <Header
    onhelp={() => (modal = 'help')}
    onstats={() => (modal = 'stats')}
    onleaderboard={() => (modal = 'leaderboard')}
  />

  <main>
    {#if app.status === 'loading'}
      <p class="status"><span class="spinner"></span>{app.t('loading')}</p>
    {:else if app.status === 'error'}
      <p class="status error">{app.t('error.load')}</p>
    {:else}
      {#key gameId}
        <Game />
      {/key}
    {/if}
  </main>

  <footer>
    <p>{app.t('footer.disclaimer')}</p>
    <p class="links">
      <a href={REPO_URL} target="_blank" rel="noopener">{app.t('footer.source')}</a>
      <button class="link" onclick={() => (modal = 'privacy')}>{app.t('footer.privacy')}</button>
      <a href={KOFI_URL} target="_blank" rel="noopener">{app.t('footer.kofi')}</a>
    </p>
  </footer>
</div>

{#if modal === 'help'}
  <HelpModal onclose={() => (modal = null)} />
{:else if modal === 'stats'}
  <StatsModal onclose={() => (modal = null)} />
{:else if modal === 'leaderboard'}
  <LeaderboardModal onclose={() => (modal = null)} />
{:else if modal === 'privacy'}
  <PrivacyModal onclose={() => (modal = null)} />
{/if}

<style>
  .page {
    max-width: 1120px;
    margin: 0 auto;
    padding: 18px 14px 30px;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  main {
    flex: 1;
  }
  .status {
    text-align: center;
    color: var(--muted);
    display: flex;
    gap: 10px;
    justify-content: center;
    align-items: center;
  }
  .error {
    color: var(--miss);
    font-weight: 800;
  }
  .spinner {
    width: 18px;
    height: 18px;
    border: 3px solid var(--line);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  footer {
    text-align: center;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--muted);
    text-shadow: 0 1px 2px var(--ink);
    max-width: 640px;
    margin: 0 auto;
    line-height: 1.5;
  }
  footer p {
    margin: 0 0 6px;
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 18px;
    justify-content: center;
  }
  .links a,
  .links .link {
    color: var(--f-normal);
    font-weight: 800;
    font-size: 0.82rem;
  }
</style>
