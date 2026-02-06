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

    // Buat nama file unik agar tidak bentrok di R2
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    
    // Simpan file mentah-mentah ke R2
    await c.env.R2_BUCKET.put(fileName, file);

    return c.json({ 
      success: true, 
      fileName: fileName 
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// Penanganan file statis dan routing SPA (Single Page Application)
app.get('/*', async (c) => {
  const res = await c.env.ASSETS.fetch(c.req.raw);
  
  // Jika file tidak ditemukan (seperti /admin), kirimkan index.html
  // agar React Router di frontend yang menangani tampilannya.
  if (res.status === 404) {
    return c.env.ASSETS.fetch(new Request(new URL('/', c.req.url)));
  }
  
  return res;
});

export default app;