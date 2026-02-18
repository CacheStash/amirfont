

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

// Fungsi ini membungkus file mentah menjadi kontainer ZIP yang valid secara manual
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  CRC_TABLE[i] = c;
}

function calculateCRC32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xFF];
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createMultiZip(files) {
  const date = new Date();
  const time = ((date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1));
  const dte = (((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate());
  
  let offset = 0;
  let centralDirectory = [];
  let zipParts = [];

  files.forEach(file => {
    const fileContent = new Uint8Array(file.content);
    const crc = calculateCRC32(fileContent); // FIXED: Hitung CRC32 asli
    const utf8 = new TextEncoder().encode(file.name);
    
    // 1. Local File Header (30 bytes + filename)
    const header = new Uint8Array(30 + utf8.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true); 
    view.setUint16(4, 20, true);         // Version needed: 2.0
    view.setUint16(8, 0, true);          // Method: 0 (Stored)
    view.setUint16(10, time, true); 
    view.setUint16(12, dte, true);
    view.setUint32(14, crc, true);       // FIXED: Masukkan CRC32
    view.setUint32(18, fileContent.byteLength, true); 
    view.setUint32(22, fileContent.byteLength, true);
    view.setUint16(26, utf8.length, true); 
    header.set(utf8, 30);
    
    zipParts.push(header, fileContent);

    // 2. Central Directory Header (46 bytes + filename)
    const cd = new Uint8Array(46 + utf8.length);
    const cdView = new DataView(cd.buffer);
    cdView.setUint32(0, 0x02014b50, true); 
    cdView.setUint16(4, 20, true);         // Version made by
    cdView.setUint16(6, 20, true);         // Version needed
    cdView.setUint16(10, 0, true);         // Method: 0 (Stored)
    cdView.setUint16(12, time, true); 
    cdView.setUint16(14, dte, true);
    cdView.setUint32(16, crc, true);       // FIXED: Masukkan CRC32
    cdView.setUint32(20, fileContent.byteLength, true); 
    cdView.setUint32(24, fileContent.byteLength, true);
    cdView.setUint16(28, utf8.length, true); 
    cdView.setUint32(42, offset, true); 
    cd.set(utf8, 46);
    centralDirectory.push(cd);

    offset += header.byteLength + fileContent.byteLength;
  });

  const cdTotalLen = centralDirectory.reduce((acc, curr) => acc + curr.length, 0);
  const result = new Uint8Array(offset + cdTotalLen + 22);
  let curPos = 0;
  [...zipParts, ...centralDirectory].forEach(part => { result.set(part, curPos); curPos += part.length; });

  const eocdView = new DataView(result.buffer, offset + cdTotalLen);
  eocdView.setUint32(0, 0x06054b50, true); 
  eocdView.setUint16(8, files.length, true); 
  eocdView.setUint16(10, files.length, true); 
  eocdView.setUint32(12, cdTotalLen, true); 
  eocdView.setUint32(16, offset, true);

  return result;
}

// FUNGSI BARU: Cek apakah user ada di tabel fontadmin
async function isUserAdmin(userId, env) {
  try {
    const res = await fetch(
      `${env.VITE_SUPABASE_URL}/rest/v1/fontadmin?id=eq.${userId}&select=id`,
      { 
        headers: { 
          'apikey': env.VITE_SUPABASE_ANON_KEY, 
          'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}` 
        } 
      }
    );
    const data = await res.json();
    return data && data.length > 0; // Jika ID ada di tabel fontadmin, return true
  } catch (e) { return false; }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Handling CORS (Preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, apikey, Content-Type, X-Order-ID',
        }
      });
    }

    // --- 2. DIAGNOSTIC CHECK ---
    if (!env.ASSETS) {
      const availableBindings = JSON.stringify(Object.keys(env), null, 2);
      return new Response(
        `CRITICAL ERROR: env.ASSETS is missing!\n\nAvailable Bindings:\n${availableBindings}`,
        { status: 500 }
      );
    }

    // --- 3. API Fonts (Public Read) ---
    if (url.pathname.startsWith('/api/fonts/')) {
      const fontName = decodeURIComponent(url.pathname.split('/').pop());
      try {
        const object = await env.R2_BUCKET.get(fontName);
        if (!object) return new Response(`Font not found`, { status: 404 });
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('Access-Control-Allow-Origin', '*');
        
        // Ubah dari 1 tahun menjadi 'no-cache' atau durasi pendek agar browser selalu validasi ke server
        headers.set('Cache-Control', 'no-cache, no-store, must-revalidate'); 
        
        return new Response(object.body, { headers });
      } catch (e) { return new Response('Error fetching font', { status: 500 }); }
    }

    // --- 4. API Images (Public Read With Cache) ---
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

    // --- 5. API Admin Upload (Proteksi via Tabel fontadmin) ---
    if (url.pathname.startsWith('/api/admin/upload/') && request.method === 'PUT') {
      try {
        const authHeader = request.headers.get('Authorization');
        const user = await getSupabaseUser(authHeader, env);
        
        // Proteksi: Hanya user yang terdaftar di tabel fontadmin yang bisa upload
        if (!user || !(await isUserAdmin(user.id, env))) {
          return new Response(JSON.stringify({ error: "ADMIN_ONLY_ACCESS" }), { status: 403 });
        }

        const fileName = decodeURIComponent(url.pathname.split('/').pop());
        await env.R2_BUCKET.put(fileName, request.body, {
          httpMetadata: { contentType: request.headers.get('Content-Type') || 'application/octet-stream' }
        });

        // FIXED: Gunakan kunci "fileName" agar cocok dengan FontUploadForm.tsx
        return new Response(JSON.stringify({ success: true, fileName: fileName }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500 }); }
    }

    

    // --- 7. API Secure ZIP Download (For Buyers) ---
    if (url.pathname.startsWith('/api/download-zip')) {
      const rawFile = url.searchParams.get('file') || ''; // AMBIL PARAM MENTAH
      const transactionId = url.searchParams.get('order'); 
      const injectedType = url.searchParams.get('type') || '';

      try {
        const authHeader = request.headers.get('Authorization');
        
        // 1. Validasi Identitas User (RLS Bypass via authHeader)
        const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
        const supabaseKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

        const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: { 'Authorization': authHeader, 'apikey': supabaseKey }
        });
        const user = userRes.ok ? await userRes.json() : null;
        if (!user) return new Response("UNAUTHORIZED", { status: 401 });

        // 2. Ekstrak dan Bersihkan Nama File (AGAR TIDAK REFERENCE ERROR)
        const fontFile = decodeURIComponent(rawFile).split('/').pop();
        const cleanFontName = fontFile.replace(/^\d+-/, ''); // INI VARIABEL YANG ILANG TADI
        const zipName = `SUBQI_STUDIO_${cleanFontName.split('.')[0]}.zip`;

        const object = await env.R2_BUCKET.get(fontFile);
        if (!object) return new Response(`File Not Found: ${fontFile}`, { status: 404 });

        // 3. Ambil data biner font asli
        const fontData = await object.arrayBuffer();

        // 4. Fetch database (Sertakan metadata untuk MPV)
        let txData = {};
        try {
          const txRes = await fetch(
            `${supabaseUrl}/rest/v1/font_history?transaction_id=eq.${transactionId}&select=tier,usages,download_type,metadata`,
            { headers: { 'apikey': supabaseKey, 'Authorization': authHeader } }
          );
          const txRows = txRes.ok ? await txRes.json() : [];
          txData = txRows[0] || {};
        } catch (e) { console.log("DB_SILENT_ERROR"); }

        // FIXED: Deteksi Trial super kuat (Direct Injection + DB Fallback)
        const typeStr = (injectedType || txData.download_type || '').toLowerCase();
        const isTrial = typeStr.includes('trial') || typeStr.includes('demo') || fontFile.toLowerCase().includes('trial');
        
        // LOGIKA DETAIL SEAT TIERS
        const tierMap = {
          'SOLO': 'Authorized for 1 User/Seat',
          'TEAM': 'Authorized for up to 25 Users/Seats',
          'STUDIO': 'Authorized for up to 100 Users/Seats',
          'ENTERPRISE': 'Unlimited Users/Seats',
          'CORPORATE': 'Unlimited Users/Seats (Full Organization)'
        };

        const rawTier = (isTrial ? 'SOLO' : txData.tier || 'SOLO').toUpperCase();
        const tierDescription = tierMap[rawTier] || tierMap['SOLO'];
        const displayTier = `${rawTier} - ${tierDescription}`; // Hasil: SOLO - Authorized for 1 User/Seat

        const usages = isTrial ? ['trial'] : (txData.usages && txData.usages.length > 0 ? txData.usages : ['desktop']);


        // 5. DATABASE TEKS LISENSI (100% Sync dengan visual LicenseReceipt.tsx)
        const TEXT_DB = {
          trial: {
            title: "PERSONAL USE ONLY (DEMO)",
            grant: "Permitted exclusively for personal, non-commercial use, such as educational assignments, portfolio pieces, or preliminary testing.",
            charSet: "The Demo version is a trial asset and contains a limited glyph set.",
            restrictions: "Commercial utilization, business promotion, social media advertising, or revenue-generating activities are strictly prohibited."
          },
          desktop: "Grants the right to install the font software on a local machine to create static visual content (PNG, JPG, PDF) for digital and print media, including commercial projects.",
          logo_branding: "Grants the right to utilize the font as a core element of a visual identity system, including logos and wordmarks. This license includes all permissions associated with a standard Desktop License.",
          social_web: "Specifically for digital platforms, including website embedding and social media content. Tiered by monthly impressions: Small (50k), Medium (500k), Large (5m), Enterprise (Unlimited).",
          app: "Grants the right to embed the font software into mobile applications or software. This license includes all permissions associated with a standard Desktop License.",
          broadcast: "Grants the right to utilize the font software in television, cinema, or streaming. This license includes all permissions associated with a standard Desktop License.",
          server: "Grants the right to install the font software on a server for product customization. This license includes all permissions associated with a standard Desktop License.",
          corporate: "A comprehensive license covering all categories for an entire organization with no limits on seats or impressions."
        };

        // 4. Susun isi LICENSE.txt
        const issueDate = new Date().toLocaleDateString();
        let licenseBody = `SUBQI STUDIO — OFFICIAL LICENSE CERTIFICATE\n`;
        licenseBody += `========================================================================\n`;
        licenseBody += `ORDER ID       : ${transactionId || 'N/A'} (USE AS INITIAL PASSWORD / RESETTER)\n`;
        licenseBody += `LICENSE HOLDER : ${user.email} (USE AS LOGIN USERNAME)\n`;
        licenseBody += `ISSUE DATE     : ${issueDate}\n`;
        licenseBody += `ASSET NAME     : ${cleanFontName}\n`;
        licenseBody += `SEAT TIER      : ${displayTier}\n`;
        
        // OTOMATIS: Tambahkan baris MPV Reach jika ada di metadata
        if (!isTrial && txData.metadata?.mpv) {
          licenseBody += `MONTHLY REACH  : ${txData.metadata.mpv} (MONTHLY PAGE VIEWS)\n`;
        }
        
        licenseBody += `------------------------------------------------------------------------\n\n`;

        licenseBody += `LICENSED USAGE TERMS:\n\n`;
        usages.forEach((u, i) => {
          if (isTrial) {
            // FIXED: Struktur Trial identik dengan visual struk
            licenseBody += `${i + 1}. ${TEXT_DB.trial.title}:\n`;
            licenseBody += `${TEXT_DB.trial.grant}\n\n`;
            licenseBody += `CHARACTER SET: ${TEXT_DB.trial.charSet}\n\n`;
            licenseBody += `RESTRICTIONS: ${TEXT_DB.trial.restrictions}\n\n`;
          } else {
            const title = `${u.replace('_', ' & ').toUpperCase()} LICENSE`;
            licenseBody += `${i + 1}. ${title}:\n`;
            licenseBody += `${TEXT_DB[u] || TEXT_DB.desktop}\n\n`;
          }
        });


        licenseBody += `GENERAL RULES:\n`;
        licenseBody += `1. This license is non-transferable and belongs strictly to the buyer.\n`;
        licenseBody += `2. You may not sell, rent, sublicense, or redistribute the font files.\n`;
        licenseBody += `3. The font software remains the sole property of Subqi Studio.\n\n`;
        licenseBody += `FULL DIGITAL RECEIPT:\nhttps://subqi-studio.fontshop.workers.dev/user/receipt/${transactionId}`;

        const licenseData = new TextEncoder().encode(licenseBody.trim());

        // 5. Gabungkan Font + LICENSE.txt ke dalam ZIP
        const zipData = createMultiZip([
          { name: cleanFontName, content: fontData },
          { name: 'LICENSE.txt', content: licenseData }
        ]);

        const headers = new Headers();
        headers.set('Content-Type', 'application/zip');
        headers.set('Content-Disposition', `attachment; filename="${zipName}"`);
        // EXPOSE HEADERS: Agar frontend bisa membaca nama file asli
        headers.set('Access-Control-Expose-Headers', 'Content-Disposition');
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('X-License-Owner', user.email);
        headers.set('X-Order-ID', transactionId || 'N/A');
        headers.set('X-License-Status', 'VALID_COMMERCIAL');
        headers.set('Access-Control-Allow-Headers', 'Authorization, apikey, X-Order-ID');
        return new Response(zipData, { headers });
      } catch (e) { return new Response("Download Failed", { status: 500 }); }
    }

   // --- 9. API Backdoor Password Reset (Transaction ID as Key) ---
    if (url.pathname === '/api/auth/backdoor-reset' && request.method === 'POST') {
      console.log("BACKDOOR_RESET_REQUEST_RECEIVED"); // Tambahkan log di dashboard Cloudflare
      try {
        const { email, transactionId } = await request.json();
        const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
        const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY; 

        // CEK 1: Apakah kunci admin ada?
        if (!serviceRoleKey) {
          return new Response(JSON.stringify({ error: "SERVICE_KEY_MISSING" }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
          });
        }

        // CEK 2: Verifikasi kecocokan ID transaksi di database
        const checkRes = await fetch(
          `${supabaseUrl}/rest/v1/font_history?transaction_id=eq.${transactionId}&fontbuyer!inner.email=eq.${email}&select=user_id`,
          { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
        );
        const checkData = await checkRes.json();

        if (!checkData || checkData.length === 0) {
          return new Response(JSON.stringify({ error: "INVALID_ORDER_OR_EMAIL" }), { 
            status: 403,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const userId = checkData[0].user_id;

        // CEK 3: Update Password via Admin API
        const resetRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
          method: 'PUT',
          headers: { 
            'apikey': serviceRoleKey, 
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password: transactionId })
        });

        if (resetRes.ok) {
          return new Response(JSON.stringify({ success: true }), { 
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
          });
        }
        
        return new Response(JSON.stringify({ error: "AUTH_ADMIN_API_FAILED" }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) { 
        return new Response(JSON.stringify({ error: e.message }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }); 
      }
    }

    // --- 8. Serve Frontend (SPA Handler) ---
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