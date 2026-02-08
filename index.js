import { getAssetFromKV, NotFoundError, MethodNotAllowedError } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. API Route for Fonts
    if (url.pathname.startsWith('/api/fonts/')) {
      const fontName = url.pathname.replace('/api/fonts/', '');
      // Pastikan nama bucket sesuai binding di wrangler.toml (R2_BUCKET)
      const object = await env.R2_BUCKET.get(fontName);
      
      if (!object) return new Response('Font not found', { status: 404 });

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Cache-Control', 'public, max-age=31536000');
      return new Response(object.body, { headers });
    }

    // 2. API Route for Images (Fix iOS SSL Issue)
    if (url.pathname.startsWith('/api/images/')) {
      const imageName = url.pathname.replace('/api/images/', '');
      // Menggunakan binding yang sama
      const object = await env.R2_BUCKET.get(imageName);
      
      if (!object) return new Response('Image not found', { status: 404 });

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Cache-Control', 'public, max-age=86400'); 
      return new Response(object.body, { headers });
    }

    // 3. Serve Static Assets
    try {
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
        }
      );
    } catch (e) {
      if (e instanceof NotFoundError) {
        // Fallback ke index.html untuk Single Page Application (SPA)
        try {
          const fallbackResponse = await getAssetFromKV(
            {
              request: new Request(`${url.origin}/index.html`, request),
              waitUntil: ctx.waitUntil.bind(ctx),
            },
            {
              ASSET_NAMESPACE: env.__STATIC_CONTENT,
              ASSET_MANIFEST: assetManifest,
            }
          );
          return new Response(fallbackResponse.body, fallbackResponse);
        } catch (innerE) {
          return new Response('Not Found', { status: 404 });
        }
      } else if (e instanceof MethodNotAllowedError) {
        return new Response('Method Not Allowed', { status: 405 });
      }
      return new Response('An unexpected error occurred', { status: 500 });
    }
  },
};