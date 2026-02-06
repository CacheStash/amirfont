/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono';

type Bindings = {
  R2_BUCKET: R2Bucket;
  ASSETS: { fetch: typeof fetch }; 
};

const app = new Hono<{ Bindings: Bindings }>();

// API untuk cek koneksi R2
app.get('/api/check', async (c) => {
  const bucket = c.env.R2_BUCKET;
  if (!bucket) {
    return c.json({ status: "Error", message: "R2_BUCKET belum di-binding di Dashboard." }, 500);
  }
  return c.json({ status: "Hidup Total", message: "Gudang R2 siap digunakan!" });
});

// Menangani permintaan file website dari folder ./dist
app.get('/*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;