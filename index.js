// HAPUS SEMUA IMPORT getAssetFromKV DAN MANIFEST (Penyebab utama exception)

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
      if (!object) return new Response(`Image not found: ${imageName}`, { status: 404 });

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Cache-Control', 'public, max-age=86400');
      return new Response(object.body, { headers });
    }

    // --- 3. Serve Static Assets & SPA Routing FIX ---
    // Mencoba mengambil file asli (seperti /assets/style.css atau /index.html)
    let response = await env.ASSETS.fetch(request);

    // JIKA TIDAK KETEMU (404) dan bukan request API, lempar ke index.html
    // Ini agar React Router di halaman /admin, /fonts, dll bisa bekerja saat di-refresh.
    if (response.status === 404 && !url.pathname.startsWith('/api/')) {
      const indexRequest = new Request(`${url.origin}/index.html`, request);
      response = await env.ASSETS.fetch(indexRequest);
    }

    return response;
  },
};