export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- 1. API Fonts (Aman untuk iOS) ---
    if (url.pathname.startsWith('/api/fonts/')) {
      const fontName = decodeURIComponent(url.pathname.split('/').pop());
      const object = await env.R2_BUCKET.get(fontName);
      if (!object) return new Response(`Font not found`, { status: 404 });

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Cache-Control', 'public, max-age=31536000');
      return new Response(object.body, { headers });
    }

    // --- 2. API Images (Optimasi Speed + Fix iOS) ---
    if (url.pathname.startsWith('/api/images/')) {
      const cache = caches.default;
      // Cek apakah gambar sudah ada di lemari es (cache) Cloudflare
      let response = await cache.match(request);
      if (response) return response;

      const imageName = decodeURIComponent(url.pathname.split('/').pop());
      const object = await env.R2_BUCKET.get(imageName);
      
      if (!object) return new Response(`Image not found`, { status: 404 });

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('Access-Control-Allow-Origin', '*');
      // Beritahu browser & Cloudflare untuk simpan gambar selama 7 hari
      headers.set('Cache-Control', 'public, max-age=604800, s-maxage=604800');

      const lowerName = imageName.toLowerCase();
      if (lowerName.endsWith('.png')) headers.set('Content-Type', 'image/png');
      else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) headers.set('Content-Type', 'image/jpeg');
      else if (lowerName.endsWith('.webp')) headers.set('Content-Type', 'image/webp');
      else if (lowerName.endsWith('.svg')) headers.set('Content-Type', 'image/svg+xml');

      response = new Response(object.body, { headers });
      
      // Simpan hasil ke cache secara background agar loading berikutnya instan
      ctx.waitUntil(cache.put(request, response.clone()));
      
      return response;
    }

    // --- 3. Serve Frontend & SPA Fix (Menghilangkan Server Error) ---
    try {
      let response = await env.ASSETS.fetch(request);
      
      // Jika rute tidak ditemukan (seperti /admin), kirim index.html
      if (response.status === 404) {
        return await env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
      }
      return response;
    } catch (e) {
      // Jika terjadi error saat memanggil assets, paksa kirim index.html
      return await env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
    }
  },
};