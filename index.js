export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- 0. DIAGNOSTIC CHECK (PENTING) ---
    // Jika env.ASSETS hilang, kode ini akan memberitahu kita apa yang salah
    if (!env.ASSETS) {
      const availableBindings = JSON.stringify(Object.keys(env), null, 2);
      return new Response(
        `CRITICAL ERROR: env.ASSETS is missing!\n\nAvailable Bindings:\n${availableBindings}\n\nPlease check wrangler.toml [assets] configuration.`,
        { status: 500 }
      );
    }

    // --- 1. API Fonts ---
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

    // --- 2. API Images ---
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

    // --- 3. Serve Frontend (Stable SPA Handler) ---
    try {
      let response = await env.ASSETS.fetch(request);
      
      if (response.status === 404 && !url.pathname.startsWith('/api/')) {
        const indexUrl = new URL('/index.html', request.url);
        // Buat Request baru yang bersih
        return await env.ASSETS.fetch(new Request(indexUrl));
      }
      return response;

    } catch (e) {
      return new Response(`System Error: ${e.message}`, { status: 500 });
    }
  },
};