// HAPUS import getAssetFromKV dan manifestJSON karena menyebabkan exception 
// setelah blok [site] dihapus dari wrangler.toml.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- 1. API Route for Fonts ---
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

    // --- 2. API Route for Images (R2 Proxy) ---
    if (url.pathname.startsWith('/api/images/')) {
      const imageName = decodeURIComponent(url.pathname.split('/').pop());
      const object = await env.R2_BUCKET.get(imageName);
      
      if (!object) return new Response(`Image not found: "${imageName}"`, { status: 404 });

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Cache-Control', 'public, max-age=86400');

      // Force content types for iOS compatibility
      const lowerName = imageName.toLowerCase();
      if (lowerName.endsWith('.png')) headers.set('Content-Type', 'image/png');
      else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) headers.set('Content-Type', 'image/jpeg');
      else if (lowerName.endsWith('.webp')) headers.set('Content-Type', 'image/webp');
      else if (lowerName.endsWith('.svg')) headers.set('Content-Type', 'image/svg+xml');

      return new Response(object.body, { headers });
    }

    // --- 3. Serve Static Assets (Vite Dist) ---
    // Gunakan env.ASSETS untuk melayani file dari folder /dist secara otomatis.
    return env.ASSETS.fetch(request);
  },
};