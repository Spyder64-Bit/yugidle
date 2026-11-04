/// <reference types="vitest/config" />
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { createReadStream, existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/**
 * In dev, serve /img/art/<id>.webp from the local mirror cache (.cache/img/art).
 * In production the same URL is served from R2 by functions/img/[[path]].ts.
 */
function localArt(): Plugin {
  return {
    name: 'yugidle-local-art',
    configureServer(server) {
      server.middlewares.use('/img/art', (req, res, next) => {
        const m = /^\/(\d+)\.webp$/.exec(req.url ?? '');
        const file = m && join(import.meta.dirname, '.cache/img/art', `${m[1]}.webp`);
        if (!file || !existsSync(file)) return next();
        res.setHeader('Content-Type', 'image/webp');
        createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [svelte(), localArt()],
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
