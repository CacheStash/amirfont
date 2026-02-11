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

    // --- 2. API Images (Sesuai Fonts.tsx & Aman untuk iOS) ---
    if (url.pathname.startsWith('/api/images/')) {
      const imageName = decodeURIComponent(url.pathname.split('/').pop());
      const object = await env.R2_BUCKET.get(imageName);
      
      if (!object) return new Response(`Image not found`, { status: 404 });

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Cache-Control', 'public, max-age=86400');

      // Paksa Content-Type agar Safari iOS tidak ngambek
      const lowerName = imageName.toLowerCase();
      if (lowerName.endsWith('.png')) headers.set('Content-Type', 'image/png');
      else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) headers.set('Content-Type', 'image/jpeg');
      else if (lowerName.endsWith('.webp')) headers.set('Content-Type', 'image/webp');
      else if (lowerName.endsWith('.svg')) headers.set('Content-Type', 'image/svg+xml');

      return new Response(object.body, { headers });
    }

    // --- 3. Serve Frontend (Sistem Baru: env.ASSETS) ---
    try {
      // Ambil file statis (HTML/JS/CSS) secara otomatis dari folder ./dist
      let response = await env.ASSETS.fetch(request);
      
      // Jika rute tidak ditemukan (misal user refresh di /fonts), kirim index.html
      if (response.status === 404) {
        return await env.ASSETS.fetch(new Request(`${url.origin}/index.html`, request));
      }
      
      return response;
    } catch (e) {
      return new Response('Server Error', { status: 500 });
    }
  },
};