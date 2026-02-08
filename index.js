import { getAssetFromKV, NotFoundError, MethodNotAllowedError } from '@cloudflare/kv-asset-handler';
// @ts-ignore
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- 1. API Route for Fonts ---
    if (url.pathname.startsWith('/api/fonts/')) {
      // FIX: Gunakan logic "pop()" agar bersih dari path folder
      const fontName = decodeURIComponent(url.pathname.split('/').pop());
      
      const object = await env.R2_BUCKET.get(fontName);
      if (!object) return new Response(`Font not found: ${fontName}`, { status: 404 });

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Cache-Control', 'public, max-age=31536000');
      return new Response(object.body, { headers });
    }

    // --- 2. API Route for Images (FINAL FIX) ---
    if (url.pathname.startsWith('/api/images/')) {
      // FIX UTAMA: 
      // Ambil bagian TERAKHIR dari URL (setelah slash terakhir). 
      // Ini membuang '/api/images/' atau '/api/images//' secara otomatis & bersih.
      const imageName = decodeURIComponent(url.pathname.split('/').pop());
      
      // Cek apakah file ada di R2
      const object = await env.R2_BUCKET.get(imageName);
      
      if (!object) {
        // Debugging yang lebih jujur: Kasih tau apa nama file bersih yang dicari
        return new Response(`Image not found in R2. Clean name searched: "${imageName}"`, { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Cache-Control', 'public, max-age=86400');

      // Force Content-Type (Penting untuk iOS/Browser)
      const lowerName = imageName.toLowerCase();
      if (lowerName.endsWith('.png')) headers.set('Content-Type', 'image/png');
      else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) headers.set('Content-Type', 'image/jpeg');
      else if (lowerName.endsWith('.webp')) headers.set('Content-Type', 'image/webp');
      else if (lowerName.endsWith('.svg')) headers.set('Content-Type', 'image/svg+xml');

      return new Response(object.body, { headers });
    }

    // --- 3. Serve Static Assets ---
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