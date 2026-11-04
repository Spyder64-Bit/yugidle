<script lang="ts">
  import { thumbUrl } from '../lib/data.ts';

  let { img, size = 40 }: { img: number; size?: number } = $props();
  let failed = $state(false);
</script>

<span class="thumb" style:width="{size}px" style:height="{size}px">
  {#if !failed}
    <img src={thumbUrl(img)} alt="" loading="lazy" width={size} height={size} onerror={() => (failed = true)} />
  {/if}
</span>

<style>
  .thumb {
    display: inline-block;
    flex: none;
    border-radius: 9px;
    overflow: hidden;
    background: linear-gradient(135deg, var(--f-fusion), var(--f-ritual));
    border: 2px solid var(--ink);
  }
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>
