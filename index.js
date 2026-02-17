async function verifyTurnstile(token, secretKey) {
  const formData = new FormData();
  formData.append('secret', secretKey);
  formData.append('response', token);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData
  });
  const outcome = await res.json();
  return outcome.success;
}

async function getSupabaseUser(authHeader, env) {
  if (!authHeader) return null;
  const res = await fetch(`${env.VITE_SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': authHeader,
      'apikey': env.VITE_SUPABASE_ANON_KEY,
    }
  });
  if (res.ok) return await res.json();
  return null;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, apikey, Content-Type, X-Order-ID',
        }
      });
    }

    if (!env.ASSETS) return new Response("CRITICAL ERROR: env.ASSETS is missing!", { status: 500 });

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
      } catch (e) { return new Response('Error fetching font', { status: 500 }); }
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
      } catch (e) { return new Response('Error fetching image', { status: 500 }); }
    }

    // --- 3. API Admin Upload (DIPERBAIKI) ---
    if (url.pathname.startsWith('/api/admin/upload/') && (request.method === 'PUT' || request.method === 'POST')) {
      try {
        const authHeader = request.headers.get('Authorization');
        const user = await getSupabaseUser(authHeader, env);

        // HAK AKSES LONGGAR: Selama Login (Authenticated), Bisa Upload
        if (!user) return new Response("UNAUTHORIZED", { status: 401 });

        const fileName = decodeURIComponent(url.pathname.split('/').pop());
        await env.R2_BUCKET.put(fileName, request.body, {
          httpMetadata: { contentType: request.headers.get('Content-Type') || 'application/octet-stream' }
        });

        // FIXED: Gunakan kunci "fileName" agar sinkron dengan Frontend
        return new Response(JSON.stringify({ success: true, fileName: fileName }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500 }); }
    }

    // --- 4. API Verify Bot ---
    if (url.pathname === '/api/verify-bot' && request.method === 'POST') {
      const { token } = await request.json();
      const isHuman = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY);
      return new Response(JSON.stringify({ success: isHuman }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // --- 5. API Secure ZIP Download ---
    if (url.pathname.startsWith('/api/download-zip')) {
      const fontFile = url.searchParams.get('file'); 
      const transactionId = url.searchParams.get('order'); 
      try {
        const authHeader = request.headers.get('Authorization');
        const user = await getSupabaseUser(authHeader, env);
        if (!user) return new Response("UNAUTHORIZED", { status: 401 });
        const object = await env.R2_BUCKET.get(fontFile);
        if (!object) return new Response("File Not Found", { status: 404 });
        const headers = new Headers();
        headers.set('Content-Type', 'application/octet-stream');
        headers.set('Content-Disposition', `attachment; filename="SUBQI_STUDIO_${fontFile.split('.')[0]}.zip"`);
        headers.set('X-License-Owner', user.email);
        headers.set('X-Order-ID', transactionId || 'N/A');
        headers.set('X-License-Status', 'VALID_COMMERCIAL');
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Headers', 'Authorization, apikey, X-Order-ID');
        return new Response(object.body, { headers });
      } catch (e) { return new Response("Download Failed", { status: 500 }); }
    }

    // --- 6. Serve Frontend ---
    try {
      let response = await env.ASSETS.fetch(request);
      if (response.status === 404 && !url.pathname.startsWith('/api/')) {
        const indexUrl = new URL('/index.html', request.url);
        return await env.ASSETS.fetch(new Request(indexUrl));
      }
      return response;
    } catch (e) { return new Response(`System Error: ${e.message}`, { status: 500 }); }
  },
};