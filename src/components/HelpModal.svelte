<script lang="ts">
  import { app } from '../lib/app.svelte.ts';
  import Modal from './Modal.svelte';

  let { onclose }: { onclose: () => void } = $props();
</script>

<Modal title={app.t('help.title')} {onclose}>
  <div class="help">
    <p>{app.t('help.intro')}</p>
    <p>🃏 {app.t('help.classic')}</p>
    <ul class="legend">
      <li><span class="sw hit"></span>{app.t('help.green')}</li>
      <li><span class="sw partial"></span>{app.t('help.yellow')}</li>
      <li><span class="sw miss"></span>{app.t('help.red')}</li>
      <li><span class="sw miss arrow">▲▼</span>{app.t('help.arrows')}</li>
    </ul>
    <p>{app.t('help.ban')}</p>
    <p>🖼️ {app.t('help.artwork')}</p>
    <p>📜 {app.t('help.text')}</p>
    <p>{app.t('help.tiers')}</p>
    <form method="dialog"><button class="btn primary">{app.t('help.play')}</button></form>
  </div>
</Modal>

<style>
  .help {
    font-size: 0.97rem;
    line-height: 1.55;
    font-weight: 600;
    max-width: 68ch;
  }
  p {
    margin: 0 0 12px;
  }
  .legend {
    list-style: none;
    padding: 0;
    margin: 0 0 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .legend li {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .sw {
    flex: none;
    width: 40px;
    height: 28px;
    border-radius: 8px;
    border: 3px solid var(--ink);
    box-shadow: 0 3px 0 var(--ink);
    display: inline-grid;
    place-items: center;
    font-size: 0.7rem;
    color: #fff;
  }
  .hit {
    background: var(--hit);
  }
  .partial {
    background: var(--partial);
  }
  .miss {
    background: var(--miss);
  }
  form {
    text-align: center;
    margin-top: 8px;
  }
</style>
