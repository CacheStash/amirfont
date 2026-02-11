export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- 1. API Fonts (Aman & Stabil) ---
    if (url.pathname.startsWith('/api/fonts/')) {
      const fontName = decodeURIComponent(url.pathname.split('/').pop());
      try {
        const object = await env.R2_BUCKET.get(fontName);
        if (!object) return new Response(`Font not found`, { status: 404 });

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Cache-Control', 'public, max-age=31536000');
        return new Response(object.body, { headers });
      } catch (e) {
        return new Response('Error fetching font', { status: 500 });
      }
    }

    // --- 2. API Images (Cache & iOS Fix) ---
    if (url.pathname.startsWith('/api/images/')) {
      try {
        const cache = caches.default;
        let response = await cache.match(request);
        if (response) return response;

        const imageName = decodeURIComponent(url.pathname.split('/').pop());
        const object = await env.R2_BUCKET.get(imageName);
        
        if (!object) return new Response(`Image not found`, { status: 404 });

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Cache-Control', 'public, max-age=604800, s-maxage=604800');

        const lowerName = imageName.toLowerCase();
        if (lowerName.endsWith('.png')) headers.set('Content-Type', 'image/png');
        else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) headers.set('Content-Type', 'image/jpeg');
        else if (lowerName.endsWith('.webp')) headers.set('Content-Type', 'image/webp');
        else if (lowerName.endsWith('.svg')) headers.set('Content-Type', 'image/svg+xml');

        response = new Response(object.body, { headers });
        ctx.waitUntil(cache.put(request, response.clone()));
        
        return response;
      } catch (e) {
        return new Response('Error fetching image', { status: 500 });
      }
    }

    // --- 3. Serve Frontend & SPA Handler (ANTI-CRASH) ---
    try {
      // Coba ambil file asli (misal: /style.css, /logo.png)
      let response = await env.ASSETS.fetch(request);
      
      // Jika file tidak ketemu (404), berarti user sedang akses rute React (misal: /admin, /blog)
      // Kita harus kirim index.html, TAPI dengan request baru yang bersih.
      if (response.status === 404 && !url.pathname.startsWith('/api/')) {
        const indexUrl = new URL('/index.html', request.url);
        return await env.ASSETS.fetch(new Request(indexUrl, {
            method: 'GET',
            headers: request.headers
        }));
      }
      
      return response;

    } catch (e) {
      // --- EMERGENCY FALLBACK ---
      // Jika semua cara di atas gagal/crash, kirim index.html sebagai upaya terakhir.
      // Ini mencegah Error 1101 muncul di layar user.
      try {
          const indexUrl = new URL('/index.html', request.url);
          return await env.ASSETS.fetch(indexUrl);
      } catch (err) {
          return new Response("Critical System Error: Unable to load application.", { status: 500 });
      }
    }
  },
};