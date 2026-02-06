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

app.get('/*', async (c) => {
  const res = await c.env.ASSETS.fetch(c.req.raw);
  
  // LOGIKA PENTING: Jika reload di /admin dan file tidak ditemukan (404),
  // paksa server berikan index.html agar React Router bisa bangun lagi.
  if (res.status === 404) {
    return c.env.ASSETS.fetch(new Request(new URL('/', c.req.url)));
  }
  if (res.status === 404) {
    const url = new URL(c.req.url);
    const isAsset = url.pathname.includes('.'); // Cek apakah ada titik (ekstensi file)

    if (!isAsset) {
      return c.env.ASSETS.fetch(new Request(new URL('/', c.req.url)));
    }
  }
  return res;
});

export default app;