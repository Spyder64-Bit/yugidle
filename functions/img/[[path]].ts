/**
 * Cloudflare Pages Function: serves /img/art/<id>.webp from the R2 bucket bound as IMAGES.
 * Responses are cached at the edge and in browsers for a year (images never change).
 */
interface Env {
  IMAGES: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params, waitUntil }) => {
  const key = (params.path as string[]).join('/');
  if (!/^art\/\d+\.webp$/.test(key)) return new Response('Not found', { status: 404 });

  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) return hit;

  const obj = await env.IMAGES.get(key);
  if (!obj) return new Response('Not found', { status: 404 });

  const res = new Response(obj.body, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: obj.httpEtag,
    },
  });
  waitUntil(cache.put(request, res.clone()));
  return res;
};
