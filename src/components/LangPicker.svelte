<script lang="ts">
  import br from 'flag-icons/flags/4x3/br.svg';
  import de from 'flag-icons/flags/4x3/de.svg';
  import fr from 'flag-icons/flags/4x3/fr.svg';
  import gb from 'flag-icons/flags/4x3/gb.svg';
  import it from 'flag-icons/flags/4x3/it.svg';
  import { app } from '../lib/app.svelte.ts';
  import { LANG_LABELS } from '../lib/i18n/index.ts';
  import { LANGS, type Lang } from '../lib/types.ts';

  // Flags are bundled SVGs (flag-icons, MIT): no emoji, which Windows renders as plain letters.
  // Portuguese uses Brazil's flag because the translation is Brazilian Portuguese.
  const FLAG: Record<Lang, string> = { en: gb, it, fr, de, pt: br };

  let open = $state(false);
  let root: HTMLDivElement;
  let items: HTMLButtonElement[] = $state([]);

  function toggle() {
    open = !open;
    if (open) queueMicrotask(() => items[LANGS.indexOf(app.settings.lang)]?.focus());
  }

  function pick(l: Lang) {
    open = false;
    if (l !== app.settings.lang) app.setLang(l);
    root.querySelector<HTMLButtonElement>('.current')?.focus();
  }

  function onkeydown(e: KeyboardEvent) {
    if (!open) return;
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      open = false;
      root.querySelector<HTMLButtonElement>('.current')?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = LANGS.length;
      items[(i + (e.key === 'ArrowDown' ? 1 : n - 1) + n) % n]?.focus();
    }
  }
</script>

<svelte:window
  onclick={(e) => open && !root.contains(e.target as Node) && (open = false)}
/>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="picker" bind:this={root} {onkeydown}>
  <button
    class="icon current"
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-label="{app.t('lang')}: {LANG_LABELS[app.settings.lang]}"
    title={LANG_LABELS[app.settings.lang]}
    onclick={toggle}
  >
    <img src={FLAG[app.settings.lang]} alt="" width="24" height="18" />
  </button>
  {#if open}
    <ul role="listbox" aria-label={app.t('lang')}>
      {#each LANGS as l, i (l)}
        <li role="presentation">
          <button
            role="option"
            aria-selected={l === app.settings.lang}
            class:sel={l === app.settings.lang}
            bind:this={items[i]}
            onclick={() => pick(l)}
          >
            <img src={FLAG[l]} alt="" width="24" height="18" />
            <span>{LANG_LABELS[l]}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .picker {
    position: relative;
  }
  img {
    display: block;
    border-radius: 3px;
    border: 2px solid var(--ink);
    object-fit: cover;
  }
  ul {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    z-index: 20;
    margin: 0;
    padding: 6px;
    list-style: none;
    background: var(--panel);
    border: 3px solid var(--ink);
    border-radius: 14px;
    box-shadow: var(--pop-lg);
    min-width: 170px;
    animation: drop 0.18s cubic-bezier(0.3, 1.6, 0.5, 1);
  }
  @keyframes drop {
    from {
      transform: translateY(-6px) scale(0.96);
      opacity: 0;
    }
  }
  li button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: var(--text);
    font: inherit;
    font-weight: 800;
    cursor: pointer;
    text-align: left;
  }
  li button:hover,
  li button:focus-visible {
    background: var(--panel-2);
    outline: none;
  }
  li button.sel {
    background: var(--f-normal);
    color: var(--ink);
  }
</style>
