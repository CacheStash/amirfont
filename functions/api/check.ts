export async function onRequest(context) {
  // Kita coba panggil R2_BUCKET yang kamu buat di dashboard tadi
  const bucket = context.env.R2_BUCKET;

  if (!bucket) {
    return new Response(JSON.stringify({ 
      status: "Setengah Hidup", 
      message: "Folder functions terbaca, tapi R2 belum di-binding di dashboard." 
    }), { headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ 
    status: "Hidup Total", 
    message: "R2 Berhasil Terhubung!" 
  }), { headers: { "Content-Type": "application/json" } });
}