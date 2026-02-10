// HAPUS import getAssetFromKV dan manifest lama karena sudah tidak dipakai di sistem Assets baru

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- 1. API Route for Fonts (Tetap Sama) ---
    if (url.pathname.startsWith('/api/fonts/')) {
      const fontName = decodeURIComponent(url.pathname.split('/').pop());
      const object = await env.R2_BUCKET.get(fontName);
      if (!object) return new Response(`Font not found: ${fontName}`, { status: 404 });

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Cache-Control', 'public, max-age=31536000');
      return new Response(object.body, { headers });
    }

    // --- 2. API Route for Images (Tetap Sama) ---
    if (url.pathname.startsWith('/api/images/')) {
      const imageName = decodeURIComponent(url.pathname.split('/').pop());
      const object = await env.R2_BUCKET.get(imageName);
      if (!object) return new Response(`Image not found in R2: "${imageName}"`, { status: 404 });

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Cache-Control', 'public, max-age=86400');
      return new Response(object.body, { headers });
    }

    // --- 3. Serve Static Assets (VERSI BARU) ---
    // Di sistem Cloudflare Assets yang baru, jika kita tidak mengembalikan Response,
    // Cloudflare akan otomatis mencari file di folder /dist (termasuk fallback index.html).
    // Jadi kita cukup membiarkan fungsi berakhir di sini (return undefined).
    return env.ASSETS.fetch(request);
  },
};