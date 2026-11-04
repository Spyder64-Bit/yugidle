<script lang="ts">
  // Tilted, slowly drifting wall of monster artwork behind the whole app.
  // Uses one atlas image (public/bg/wall.webp, built by `npm run bg`).
  const COLS = 10;
  const ROWS = 6;

  // Each on-screen row shows one atlas row, doubled for a seamless loop.
  // 9 on-screen rows (atlas rows repeat) so the tilted wall covers tall screens too.
  const rows = Array.from({ length: 9 }, (_, i) => ({
    i,
    r: (i * 5) % ROWS,
    dir: i % 2 ? 1 : -1,
    duration: 80 + ((i * 17) % 40),
  }));
  let loaded = $state(false);
</script>

<img src="/bg/wall.webp" alt="" hidden onload={() => (loaded = true)} />

<div class="wall" class:loaded aria-hidden="true">
  <div class="tilt">
    {#each rows as row (row.i)}
      <div class="row" style:--dur="{row.duration}s" class:rev={row.dir > 0}>
        {#each [0, 1] as copy (copy)}
          {#each Array.from({ length: COLS }, (_, c) => c) as c (c)}
            <span
              class="tile"
              style:background-position="{(c / (COLS - 1)) * 100}% {(row.r / (ROWS - 1)) * 100}%"
            ></span>
          {/each}
        {/each}
      </div>
    {/each}
  </div>
  <div class="veil"></div>
</div>

<style>
  .wall {
    position: fixed;
    inset: 0;
    z-index: -1;
    overflow: hidden;
    background: var(--bg);
    opacity: 0;
    transition: opacity 1.2s ease;
  }
  .wall.loaded {
    opacity: 1;
  }
  .tilt {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 180vmax;
    transform: translate(-50%, -50%) rotate(-12deg);
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .row {
    display: flex;
    gap: 18px;
    width: max-content;
    animation: drift var(--dur) linear infinite;
  }
  .row.rev {
    animation-direction: reverse;
  }
  .tile {
    flex: none;
    width: 150px;
    height: 150px;
    border-radius: 18px;
    border: 4px solid var(--ink);
    background-image: url('/bg/wall.webp');
    background-size: 1000% 600%;
    box-shadow: 6px 6px 0 #0c072099;
  }
  /* Keeps the centre readable while letting the art pop at the edges. */
  .veil {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 75% at 50% 45%, #1b1240f2 35%, #1b1240c4 70%, #1b124080 100%),
      linear-gradient(160deg, #9b5de555, transparent 40%, #e8459a44 100%);
  }
  @keyframes drift {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(calc(-50% - 9px));
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .row {
      animation: none;
    }
  }
</style>
