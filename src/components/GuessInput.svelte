<script lang="ts">
  import { app } from '../lib/app.svelte.ts';
  import Thumb from './Thumb.svelte';

  let { exclude, onguess }: { exclude: ReadonlySet<number>; onguess: (id: number) => void } = $props();

  let query = $state('');
  let active = $state(0);
  let open = $state(false);
  let input: HTMLInputElement;

  const results = $derived(
    query.trim() ? app.index.search(query, exclude).map((id) => app.byId.get(id)!) : [],
  );

  $effect(() => {
    void results;
    active = 0;
  });

  function pick(id: number) {
    onguess(id);
    query = '';
    open = false;
    input.focus();
  }

  function onkeydown(e: KeyboardEvent) {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      open = true;
      active = (active + 1) % results.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      active = (active - 1 + results.length) % results.length;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(results[active].id);
    } else if (e.key === 'Escape') {
      open = false;
    }
  }
</script>

<div class="wrap">
  <input
    bind:this={input}
    bind:value={query}
    oninput={() => (open = true)}
    onfocus={() => (open = true)}
    onblur={() => setTimeout(() => (open = false), 150)}
    {onkeydown}
    placeholder={app.t('input.placeholder')}
    autocomplete="off"
    autocapitalize="off"
    spellcheck="false"
    role="combobox"
    aria-expanded={open && results.length > 0}
    aria-controls="guess-list"
    aria-activedescendant={open && results.length ? `opt-${results[active]?.id}` : undefined}
  />
  {#if open && query.trim()}
    <ul id="guess-list" role="listbox">
      {#each results as m, i (m.id)}
        <li
          id="opt-{m.id}"
          role="option"
          aria-selected={i === active}
          class:active={i === active}
          onmousedown={(e) => {
            e.preventDefault();
            pick(m.id);
          }}
          onmouseenter={() => (active = i)}
        >
          <Thumb img={m.img} size={36} />
          <span class="names">
            <span class="name">{app.name(m)}</span>
            {#if app.name(m) !== m.name}<span class="en">{m.name}</span>{/if}
          </span>
        </li>
      {:else}
        <li class="empty">{app.t('input.noResults')}</li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .wrap {
    position: relative;
    width: 100%;
  }
  input {
    width: 100%;
    font: inherit;
    font-size: 1.1rem;
    font-weight: 700;
    padding: 15px 18px;
    border-radius: 16px;
    border: 3px solid var(--ink);
    background: var(--text);
    color: var(--ink);
    outline: none;
    box-shadow: 6px 6px 0 var(--ink);
    transition:
      box-shadow 0.15s,
      transform 0.15s;
  }
  input::placeholder {
    color: #6e5fa0;
  }
  input:focus {
    box-shadow: 6px 6px 0 var(--f-trap);
    transform: translate(-1px, -1px);
  }
  ul {
    position: absolute;
    z-index: 20;
    top: calc(100% + 12px);
    left: 0;
    right: 0;
    margin: 0;
    padding: 6px;
    list-style: none;
    background: var(--text);
    color: var(--ink);
    border: 3px solid var(--ink);
    border-radius: 16px;
    box-shadow: 6px 6px 0 var(--ink);
    max-height: 380px;
    overflow-y: auto;
    animation: open 0.18s cubic-bezier(0.3, 1.5, 0.5, 1);
  }
  @keyframes open {
    from {
      transform: translateY(-6px) scale(0.98);
      opacity: 0;
    }
  }
  li {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 6px 8px;
    border-radius: 10px;
    cursor: pointer;
    border: 2px solid transparent;
  }
  li.active {
    background: var(--f-normal);
    border-color: var(--ink);
  }
  .names {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .name {
    font-weight: 800;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .en {
    font-size: 0.78rem;
    color: #5b4d8a;
  }
  .empty {
    color: #5b4d8a;
    cursor: default;
  }
</style>
