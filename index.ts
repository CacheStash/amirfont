/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono';

type Bindings = {
  R2_BUCKET: R2Bucket;
  ASSETS: { fetch: typeof fetch };
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/api/check', (c) => c.json({ status: "Hidup Total", message: "Gudang R2 siap!" }));

// API UNTUK MENERIMA FILE FONT
app.post('/api/upload', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body['file'] as File;

    if (!file) return c.json({ success: false, error: "File tidak ditemukan" }, 400);

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    await c.env.R2_BUCKET.put(fileName, file);

    return c.json({ success: true, fileName: fileName });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ENDPOINT BARU: MENGAMBIL FILE FONT DARI R2 UNTUK DITAMPILKAN DI WEB
app.get('/api/fonts/:filename', async (c) => {
  const filename = c.req.param('filename');
  const object = await c.env.R2_BUCKET.get(filename);

  if (!object) return c.json({ error: "Font tidak ditemukan" }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000'); // Cache 1 tahun agar cepat

  return new Response(object.body, { headers });
});

app.get('/*', async (c) => {
  const res = await c.env.ASSETS.fetch(c.req.raw);
  
  if (res.status === 404) {
    const url = new URL(c.req.url);
    // Jika pathname mengandung titik (misal .css, .ttf, .js), biarkan tetap 404 agar tidak merusak sistem
    if (url.pathname.includes('.')) {
      return res;
    }
    // Jika tidak ada titik, baru kita arahkan ke index.html (untuk React Router)
    return c.env.ASSETS.fetch(new Request(new URL('/', c.req.url)));
  }
  return res;
});

export default app;