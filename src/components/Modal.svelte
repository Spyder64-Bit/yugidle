<script lang="ts">
  import type { Snippet } from 'svelte';
  import { app } from '../lib/app.svelte.ts';

  let { title, onclose, children }: { title: string; onclose: () => void; children: Snippet } = $props();
  let dialog: HTMLDialogElement;

  $effect(() => {
    dialog.showModal();
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
  bind:this={dialog}
  onclose={onclose}
  onclick={(e) => e.target === dialog && dialog.close()}
  aria-labelledby="modal-title"
>
  <div class="inner">
    <header>
      <h2 id="modal-title">{title}</h2>
      <button class="icon" onclick={() => dialog.close()} aria-label={app.t('btn.close')}>✕</button>
    </header>
    {@render children()}
  </div>
</dialog>

<style>
  dialog {
    padding: 0;
    border: 3px solid var(--ink);
    border-radius: 20px;
    background: var(--panel);
    color: var(--text);
    width: min(560px, calc(100vw - 24px));
    max-height: calc(100dvh - 40px);
    box-shadow: 10px 10px 0 var(--ink);
  }
  dialog[open] {
    animation: pop 0.35s cubic-bezier(0.3, 1.6, 0.5, 1);
  }
  dialog::backdrop {
    background: #0c0720b0;
    backdrop-filter: blur(4px);
  }
  .inner {
    padding: 18px 22px 24px;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  h2 {
    margin: 0;
    font-family: var(--font-title);
    font-weight: 400;
    color: var(--f-normal);
    font-size: 1.5rem;
    text-shadow: 3px 3px 0 var(--ink);
  }
  @keyframes pop {
    from {
      transform: scale(0.85) translateY(20px);
      opacity: 0;
    }
  }
</style>
