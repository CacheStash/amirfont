// index.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- 1 & 2. API Routes (Sudah Oke) ---
    if (url.pathname.startsWith('/api/')) {
      // ... kode API R2 kamu ...
    }

    // --- 3. Serve Static Assets FIX ---
    try {
      if (!env.ASSETS) {
        return new Response("ASSETS binding is missing. Check your wrangler.toml", { status: 500 });
      }

      let response = await env.ASSETS.fetch(request);

      // SPA Routing: Jika 404, arahkan ke index.html
      if (response.status === 404 && !url.pathname.startsWith('/api/')) {
        const indexRequest = new Request(`${url.origin}/index.html`, request);
        return await env.ASSETS.fetch(indexRequest);
      }

      return response;
    } catch (e) {
      return new Response(e.message, { status: 500 });
    }
  },
};