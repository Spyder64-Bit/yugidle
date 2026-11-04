<script lang="ts">
  import { app } from '../lib/app.svelte.ts';
  import { REPO_URL } from '../lib/config.ts';
  import Modal from './Modal.svelte';

  let { onclose }: { onclose: () => void } = $props();
  const PARAGRAPHS = ['privacy.p1', 'privacy.p2', 'privacy.p3', 'privacy.p4', 'privacy.p5'] as const;
</script>

<Modal title={app.t('privacy.title')} {onclose}>
  <div class="text">
    {#each PARAGRAPHS as p (p)}
      <p>{app.t(p)}</p>
    {/each}
    <p><a href={REPO_URL} target="_blank" rel="noopener">{app.t('footer.source')} ↗</a></p>
  </div>
</Modal>

<style>
  .text {
    font-size: 0.95rem;
    line-height: 1.55;
    font-weight: 600;
  }
  p {
    margin: 0 0 12px;
  }
  a {
    color: var(--f-normal);
    font-weight: 800;
  }
</style>
