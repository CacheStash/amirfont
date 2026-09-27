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


async function fetchFileBuffer(fileName, env) {
  // 1. Coba ambil dari R2
  const object = await env.R2_BUCKET.get(fileName);
  if (object) return { body: await object.arrayBuffer(), contentType: object.httpMetadata?.contentType };

  // 2. Jika tidak ada di R2, asumsikan ini adalah Google Drive ID
  // Gunakan Google UserContent CDN (lh3) untuk performa lebih cepat dan bebas batas lonjakan trafik/virus HTML
  const driveUrl = `https://lh3.googleusercontent.com/d/${fileName}`;
  let res = await fetch(driveUrl);

  // Fallback ke uc?export=download jika lh3 gagal atau dibatasi
  if (!res.ok || (res.headers.get('content-type') || '').includes('text/html')) {
    const fallbackUrl = `https://drive.google.com/uc?export=download&id=${fileName}&confirm=t`;
    const fallbackRes = await fetch(fallbackUrl);
    if (fallbackRes.ok) {
      res = fallbackRes;
    }
  }
  
  if (res.ok) {
    const contentType = res.headers.get('content-type') || '';
    // Proteksi: Jika Google memberikan HTML (halaman peringatan virus), return null
    // Karena Opentype.js tidak bisa memproses HTML sebagai Font
    if (contentType.includes('text/html')) {
      console.error(`DRIVE_REJECTED_BINARY_FETCH: ${fileName} - Size likely too large`);
      return null;
    }
    return { body: await res.arrayBuffer(), contentType: contentType };
  }

  return null;
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
    const authKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
    const res = await fetch(
      `${env.VITE_SUPABASE_URL}/rest/v1/fontadmin?id=eq.${userId}&select=id`,
      { 
        headers: { 
          'apikey': authKey, 
          'Authorization': `Bearer ${authKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        } 
      }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return data && data.length > 0; // Jika ID ada di tabel fontadmin, return true
  } catch (e) { return false; }
}

const DEFAULT_EMAIL_TEMPLATE = {
  subject: "Your Font Order #[ORDER_ID] is Ready! - Subqi Studio",
  heading: "Thank you for your purchase, [BUYER_NAME]!",
  intro_text: "Here are your font download packages and commercial licenses. Keep your order ID safe as your proof of license.",
  warning_title: "Important Security Notice (7 Days / 7 Downloads)",
  warning_text: "These quick-access download links are valid for 7 days or up to 7 downloads (whichever comes first) to protect against unauthorized link distribution. For permanent, lifetime unlimited access, you can log in to your User Vault anytime.",
  vault_url: "https://subqi.com/user/auth",
  canvas_vip_enabled: true,
  canvas_url: "https://canvas.subqi.com",
  canvas_heading: "Font Canvas VIP Access Unlocked!",
  canvas_text: "As our commercial customer, you get free VIP access to our web-based typography creator app:",
  footer_text: "Questions or assistance? Reply directly to this email.<br>© Subqi Studio. All rights reserved."
};

const GAS_ACCOUNT_MAP = {
  "AKfycbzO1E0IkuoZIdlaM4hRyz1y84VyObjRSJUUuSc2PjQxaTHcz-rJ82cKhUA4KUs3X9c": "subqistudio@gmail.com",
  "AKfycbzgr3nOGCM9QBnaP7BD1MDY-s3uDizcckwYlo2-CkkKo1OxHr_pIjdhvOdlaPOY2tE04Q": "amirsubqisetiaji@gmail.com",
  "AKfycbw9eibNs8cKKMiusDi8aKFp2t2xU_T0gDo_FFlBMM6jZWEiX5ERbR5vF-YlLTM9XlgI": "ameervg@gmail.com"
};

function resolveGasSender(resSender, url) {
  if (resSender && resSender.includes('@')) return resSender;
  for (const [id, email] of Object.entries(GAS_ACCOUNT_MAP)) {
    if (url && url.includes(id)) return email;
  }
  return resSender || "subqistudio@gmail.com";
}

function generateOrderEmailHtml({ buyerEmail, buyerName, orderId, items, templateConfig, baseUrl }) {
  const cfg = { ...DEFAULT_EMAIL_TEMPLATE, ...(templateConfig || {}) };
  const safeName = buyerName || "Creator";
  const heading = (cfg.heading || DEFAULT_EMAIL_TEMPLATE.heading).replace(/\[BUYER_NAME\]/g, safeName).replace(/\[ORDER_ID\]/g, orderId);
  const introText = (cfg.intro_text || DEFAULT_EMAIL_TEMPLATE.intro_text).replace(/\[BUYER_NAME\]/g, safeName).replace(/\[ORDER_ID\]/g, orderId);
  const warningText = (cfg.warning_text || DEFAULT_EMAIL_TEMPLATE.warning_text).replace(/\[BUYER_NAME\]/g, safeName).replace(/\[ORDER_ID\]/g, orderId);
  const warningTitle = cfg.warning_title || DEFAULT_EMAIL_TEMPLATE.warning_title;
  const vaultUrl = cfg.vault_url || DEFAULT_EMAIL_TEMPLATE.vault_url;

  let itemsHtml = "";
  (items || []).forEach(item => {
    const isTrial = item.price === 0;
    const fontName = item.name || "Commercial Font";
    const licenseTier = item.tier || (isTrial ? "Personal Trial" : "Commercial License");
    const fileParam = item.file || item.font_files?.[0] || item.trialFileUrl || fontName;
    const downloadUrl = `${baseUrl}/api/download-zip?file=${encodeURIComponent(fileParam)}&order=${encodeURIComponent(orderId)}&email=${encodeURIComponent(buyerEmail)}`;

    itemsHtml += `
      <div style="background-color: #ffffff; border: 2px solid #000000; box-shadow: 4px 4px 0px #000000; padding: 18px 20px; margin-bottom: 14px;">
        <div style="font-size: 18px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: -0.01em; margin-bottom: 6px;">${fontName}</div>
        <div style="font-size: 12px; color: #262626; margin-bottom: 14px;">
          LICENSE TIER: <strong style="background-color: #ff5c00; color: #ffffff; border: 1.5px solid #000000; padding: 2px 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block;">${licenseTier}</strong>
        </div>
        <a href="${downloadUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; font-weight: 900; font-size: 12px; text-decoration: none; padding: 12px 22px; border: 2px solid #000000; box-shadow: 3px 3px 0px #ff5c00; text-transform: uppercase; letter-spacing: 0.05em;">Download Font & License (.ZIP)</a>
      </div>
    `;
  });

  const canvasHtml = cfg.canvas_vip_enabled ? `
    <tr>
      <td style="padding: 0 32px 24px 32px;">
        <div style="background-color: #eff6ff; border: 2px solid #000000; box-shadow: 4px 4px 0px #2563eb; padding: 20px;">
          <div style="margin-bottom: 10px;">
            <span style="background-color: #2563eb; color: #ffffff; font-size: 10px; font-weight: 900; padding: 3px 8px; border: 1.5px solid #000000; text-transform: uppercase; letter-spacing: 0.08em; display: inline-block;">VIP BONUS</span>
            <span style="color: #000000; font-size: 16px; font-weight: 900; text-transform: uppercase; margin-left: 8px; display: inline-block; vertical-align: middle;">${cfg.canvas_heading}</span>
          </div>
          <p style="font-size: 13px; color: #1e293b; margin: 8px 0 14px 0; line-height: 1.5; font-weight: 500;">
            ${cfg.canvas_text}
          </p>

          <div style="background-color: #ffffff; border: 2px solid #000000; box-shadow: 2px 2px 0px #000000; padding: 14px; margin-bottom: 14px; font-size: 13px; line-height: 1.8;">
            <div>🌐 <strong>APP URL:</strong> <a href="${cfg.canvas_url}" style="color: #2563eb; font-weight: 800; text-decoration: underline;">${cfg.canvas_url}</a></div>
            <div>👤 <strong>USERNAME:</strong> <span style="font-family: monospace; font-weight: 800; background-color: #f1f5f9; padding: 2px 6px; border: 1px solid #cbd5e1;">${buyerEmail}</span></div>
            <div>🔑 <strong>PASSWORD:</strong> <span style="font-family: monospace; font-weight: 800; background-color: #f1f5f9; padding: 2px 6px; border: 1px solid #cbd5e1;">${orderId}</span></div>
          </div>

          <div style="font-size: 12px; color: #1e293b; line-height: 1.6; font-weight: 500;">
            <strong style="text-transform: uppercase; letter-spacing: 0.05em; font-weight: 900;">Your VIP Perks:</strong>
            <ul style="margin: 6px 0 0 0; padding-left: 18px;">
              <li><strong>Purchased Fonts Unlocked:</strong> All fonts in this order are automatically activated in your Canvas suite.</li>
              <li><strong>Bonus Extras & Dingbats:</strong> Free access to exclusive ornaments and dingbats catalog-wide.</li>
              <li><strong>Full Pro Tools:</strong> High-res export, canvas saving, and SVG generation completely unlocked.</li>
            </ul>
          </div>
        </div>
      </td>
    </tr>
  ` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${(cfg.subject || DEFAULT_EMAIL_TEMPLATE.subject).replace(/\[ORDER_ID\]/g, orderId)}</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f5f4ef; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #000000; line-height: 1.5;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 3px solid #000000; box-shadow: 6px 6px 0px #000000; text-align: left;" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 32px 32px 20px 32px; border-bottom: 2px solid #000000; background-color: #ffffff;">
              <span style="display: inline-block; background-color: #000000; color: #ffffff; font-family: monospace; font-size: 11px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; padding: 4px 10px; margin-bottom: 14px;">SUBQI STUDIO™</span>
              <h1 style="margin: 0; color: #000000; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase; line-height: 1.2;">${heading}</h1>
              <p style="margin: 8px 0 0 0; color: #262626; font-size: 14px; font-weight: 500; line-height: 1.6;">${introText}</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 32px 10px 32px;">
              <div style="background-color: #fef08a; border: 2px solid #000000; box-shadow: 3px 3px 0px #000000; padding: 12px 16px; font-size: 13px;">
                <span style="color: #000000; text-transform: uppercase; font-size: 11px; font-weight: 900; letter-spacing: 0.05em;">ORDER REFERENCE:</span>
                <span style="background-color: #000000; color: #ffffff; font-family: monospace; font-weight: 900; font-size: 13px; padding: 3px 8px; margin-left: 8px; display: inline-block;">${orderId}</span>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 10px 32px 16px 32px;">
              <h2 style="color: #000000; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; margin: 12px 0;">YOUR FONT PACKAGES & COMMERCIAL LICENSES</h2>
              ${itemsHtml}
            </td>
          </tr>

          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background-color: #fff1f2; border: 2px solid #000000; box-shadow: 4px 4px 0px #e11d48; padding: 16px 18px;">
                <div style="margin-bottom: 6px;">
                  <strong style="color: #e11d48; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 900;">⚠️ ${warningTitle}</strong>
                </div>
                <p style="margin: 0; color: #4c0519; font-size: 12px; font-weight: 600; line-height: 1.6;">
                  ${warningText}
                </p>
                <div style="margin-top: 10px;">
                  <a href="${vaultUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; border: 1.5px solid #000000; padding: 6px 12px; font-size: 11px; font-weight: 900; text-decoration: none; text-transform: uppercase;">Open User Vault (Unlimited Access) →</a>
                </div>
              </div>
            </td>
          </tr>

          ${canvasHtml}

          <tr>
            <td style="padding: 22px 32px; border-top: 2px solid #000000; background-color: #fafaf9; text-align: center; font-size: 11px; font-weight: 700; color: #525252; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.6;">
              ${cfg.footer_text || DEFAULT_EMAIL_TEMPLATE.footer_text}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function triggerGasEmail(buyerEmail, buyerName, orderId, items, env) {
  const gasUrls = (env.GAS_WEBAPP_URL || "").split(',').map(u => u.trim()).filter(u => u);
  if (gasUrls.length === 0) return { success: false, error: "GAS_URL_NOT_CONFIGURED" };

  const hasPaidItem = items.some(item => item.price > 0);
  if (!hasPaidItem) return { success: false, error: "NO_PAID_ITEMS" };

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  // 1. Ambil template dinamis dari site_settings
  let templateConfig = null;
  if (supabaseUrl && serviceRoleKey) {
    try {
      const sRes = await fetch(`${supabaseUrl}/rest/v1/site_settings?key=eq.email_template_order&select=value`, {
        headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` }
      });
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData?.[0]?.value) {
          templateConfig = typeof sData[0].value === 'string' ? JSON.parse(sData[0].value) : sData[0].value;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch template from site_settings, using defaults:", e.message);
    }
  }

  const baseUrl = "https://subqi.com";
  const renderedHtml = generateOrderEmailHtml({
    buyerEmail,
    buyerName,
    orderId,
    items,
    templateConfig,
    baseUrl
  });

  const subjectTemplate = (templateConfig?.subject || DEFAULT_EMAIL_TEMPLATE.subject);
  const finalSubject = subjectTemplate.replace(/\[ORDER_ID\]/g, orderId).replace(/\[BUYER_NAME\]/g, buyerName || "Creator");

  const payload = {
    token: "$emogaAm4n_",
    action: "order",
    email: buyerEmail,
    name: buyerName,
    order_id: orderId,
    subject: finalSubject,
    htmlBody: renderedHtml,
    sender_name: "Subqi Studio"
  };

  // Load balancing across accounts
  const rotatedUrls = gasUrls.sort(() => Math.random() - 0.5);

  for (const url of rotatedUrls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const resText = await res.text();
      let resJson = null;
      try { resJson = JSON.parse(resText); } catch (_) {}

      const isSuccess = (resJson && resJson.status === "SUCCESS") || resText === "SUCCESS" || resText.includes("Order Email Sent");

      if (isSuccess) {
        const senderAccount = resolveGasSender(resJson?.sender, url);
        console.log(`GAS_DELIVERY_SUCCESS: Account ${senderAccount}`);

        // Update font_history in Supabase
        if (supabaseUrl && serviceRoleKey) {
          try {
            const hRes = await fetch(`${supabaseUrl}/rest/v1/font_history?transaction_id=eq.${encodeURIComponent(orderId)}&select=id,metadata`, {
              headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` }
            });
            const hRows = await hRes.json();
            if (hRows && hRows.length > 0) {
              for (const row of hRows) {
                const updatedMeta = {
                  ...(row.metadata || {}),
                  email_sent: true,
                  email_sent_at: new Date().toISOString(),
                  email_sent_by: senderAccount
                };
                await fetch(`${supabaseUrl}/rest/v1/font_history?id=eq.${row.id}`, {
                  method: 'PATCH',
                  headers: {
                    'apikey': serviceRoleKey,
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                  },
                  body: JSON.stringify({ metadata: updatedMeta })
                });
              }
            }
          } catch (dbErr) {
            console.error("Failed to record email_sent in font_history:", dbErr);
          }
        }

        return { success: true, sender: senderAccount };
      }
      console.warn(`GAS_LIMIT_REACHED: ${url.substring(0, 45)} returned: ${resText}`);
    } catch (e) {
      console.error(`GAS_FETCH_FAILED: ${e.message}`);
    }
  }

  return { success: false, error: "ALL_GAS_ACCOUNTS_FAILED" };
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

    // --- 3. API Fonts (Protected Read: Allowed Origins Only With Cache API & Masking Shield) ---
    if (url.pathname.startsWith('/api/fonts/')) {
      const origin = request.headers.get('Origin') || '';
      const referer = request.headers.get('Referer') || '';

      const isAllowedSource = (val) => {
        if (!val) return true;
        try {
          const parsed = val.startsWith('http://') || val.startsWith('https://')
            ? new URL(val)
            : new URL(`https://${val}`);
          const hostname = parsed.hostname.toLowerCase();
          return (
            hostname === 'bombastype.com' ||
            hostname.endsWith('.bombastype.com') ||
            hostname === 'subqi.com' ||
            hostname.endsWith('.subqi.com') ||
            hostname === 'fontcanvas.subqi.workers.dev' ||
            hostname.endsWith('.subqi.workers.dev') ||
            hostname === 'fontcanvas.pages.dev' ||
            hostname.endsWith('.fontcanvas.pages.dev') ||
            (hostname.endsWith('.workers.dev') && hostname.includes('fontcanvas')) ||
            hostname === 'localhost' ||
            hostname === '127.0.0.1'
          );
        } catch (_) {
          return false;
        }
      };

      // 1. Hotlink security check ALWAYS runs first (even before cache lookup)
      if ((origin && !isAllowedSource(origin)) || (referer && !isAllowedSource(referer))) {
        return new Response('Access Denied: Hotlinking is not permitted.', {
          status: 403,
          headers: {
            'Content-Type': 'text/plain',
            'X-Robots-Tag': 'noindex, nofollow, noarchive'
          }
        });
      }

      const fontName = decodeURIComponent(url.pathname.split('/').pop());
      const allowedOrigin = origin && isAllowedSource(origin) ? origin : '*';

      // --- MASKING CIPHER KEY (Subqi Shield v1) ---
      const FONT_CIPHER_KEY = [0x53, 0x75, 0x62, 0x71, 0x69, 0x46, 0x6F, 0x6E, 0x74, 0x56, 0x61, 0x75, 0x6C, 0x74, 0x32, 0x36];
      const FONT_MASK_LENGTH = 512;

      const maskFontBuffer = (buffer) => {
        const bytes = new Uint8Array(buffer);
        const limit = Math.min(bytes.length, FONT_MASK_LENGTH);
        const keyLen = FONT_CIPHER_KEY.length;
        const masked = new Uint8Array(bytes);
        for (let i = 0; i < limit; i++) {
          masked[i] ^= FONT_CIPHER_KEY[i % keyLen];
        }
        return masked.buffer;
      };

      try {
        const cache = caches.default;
        const cacheKey = new Request(url.toString(), { method: 'GET' });
        let cachedResponse = await cache.match(cacheKey);

        // 2. Cache Hit: Return cached binary with dynamic CORS & Vary: Origin
        if (cachedResponse && cachedResponse.headers.get('X-Font-Protection') === 'subqi-shield-v1') {
          const headers = new Headers(cachedResponse.headers);
          headers.set('Access-Control-Allow-Origin', allowedOrigin);
          headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          headers.set('Access-Control-Expose-Headers', '*');
          headers.set('Vary', 'Origin');
          return new Response(cachedResponse.body, {
            status: cachedResponse.status,
            headers
          });
        }

        // 3. Cache Miss: Fetch from R2 / Google Drive
        const fileData = await fetchFileBuffer(fontName, env);
        if (!fileData) return new Response(`Font not found`, { status: 404 });

        // Optional internal bypass for raw access via authorized key
        const isRawRequested = url.searchParams.get('raw') === 'true' && url.searchParams.get('key') === '$uperAm4n';
        const finalBody = isRawRequested ? fileData.body : maskFontBuffer(fileData.body);

        // Base headers stored in Cloudflare Worker cache (WITHOUT origin-locked CORS)
        const baseHeaders = new Headers();
        baseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        baseHeaders.set('Access-Control-Expose-Headers', '*');
        baseHeaders.set('Content-Type', isRawRequested ? (fileData.contentType || 'font/otf') : 'application/octet-stream');
        baseHeaders.set('Content-Disposition', 'inline');
        baseHeaders.set('X-Content-Type-Options', 'nosniff');
        baseHeaders.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        baseHeaders.set('X-Font-Protection', isRawRequested ? 'none' : 'subqi-shield-v1');
        baseHeaders.set('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');

        const responseToCache = new Response(finalBody, { headers: baseHeaders });
        ctx.waitUntil(cache.put(cacheKey, responseToCache.clone()));

        // Response sent to current requester has specific dynamic CORS
        const responseHeaders = new Headers(baseHeaders);
        responseHeaders.set('Access-Control-Allow-Origin', allowedOrigin);
        responseHeaders.set('Access-Control-Expose-Headers', '*');
        responseHeaders.set('Vary', 'Origin');

        return new Response(finalBody, { headers: responseHeaders });
      } catch (e) { return new Response('Error fetching font', { status: 500 }); }
    }

    // --- 4. API Images (Public Read With Cache) ---
    if (url.pathname.startsWith('/api/images/')) {
      try {
        const imageName = decodeURIComponent(url.pathname.split('/').pop());
        const lowerName = imageName.toLowerCase();

        // Block accidental access to font files via /api/images
        if (lowerName.endsWith('.otf') || lowerName.endsWith('.ttf') || lowerName.endsWith('.woff') || lowerName.endsWith('.woff2')) {
          return new Response('Access Denied: Fonts cannot be served from images endpoint.', { status: 403 });
        }

        const cache = caches.default;
        const cacheKey = new Request(url.toString(), { method: 'GET' });
        let response = await cache.match(cacheKey);
        if (response) return response;

        const fileData = await fetchFileBuffer(imageName, env);
        if (!fileData) return new Response(`Image not found`, { status: 404 });

        const headers = new Headers();
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        headers.set('X-Content-Type-Options', 'nosniff');
        headers.set('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
        
        // Tentukan Content-Type: prioritaskan hasil fetch atau fallback ke ekstensi
        let contentType = fileData.contentType || 'image/jpeg';
        if (lowerName.endsWith('.png')) contentType = 'image/png';
        else if (lowerName.endsWith('.webp')) contentType = 'image/webp';
        else if (lowerName.endsWith('.svg')) contentType = 'image/svg+xml';
        
        headers.set('Content-Type', contentType);
        
        response = new Response(fileData.body, { headers });
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
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

    if (url.pathname.startsWith('/api/admin/drive-search') && request.method === 'GET') {
      try {
        const authHeader = request.headers.get('Authorization');
        const user = await getSupabaseUser(authHeader, env);
        if (!user || !(await isUserAdmin(user.id, env))) {
          return new Response("UNAUTHORIZED", { status: 403 });
        }

        const q = url.searchParams.get('q') || "";
        const gasUrl = env.GAS_DRIVE_SEARCH_URL; 
        const token = env.GAS_TOKEN || "$uperAm4n"; 

        if (!gasUrl) throw new Error("GAS_URL_NOT_CONFIGURED");

        // Membersihkan q dari spasi berlebih di ujung dan memastikan encoding karakter khusus
        const searchParams = new URLSearchParams();
        searchParams.set('q', q.trim());
        searchParams.set('token', token);

        const finalGasUrl = `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}${searchParams.toString()}`;

        const res = await fetch(finalGasUrl);
        const contentType = res.headers.get('content-type') || '';

        // Validasi respon: Jika Google mengirimkan HTML (Error Page), jangan paksa parse JSON
        if (!res.ok || !contentType.includes('application/json')) {
          const rawError = await res.text();
          console.error("GAS_RAW_ERROR:", rawError);
          return new Response(JSON.stringify({ 
            error: "GOOGLE_API_ERROR", 
            detail: rawError.substring(0, 150) 
          }), { 
            status: 502, 
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
          });
        }

        const data = await res.json();
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) { 
        return new Response(JSON.stringify({ error: e.message, images: [], fonts: [] }), { 
          status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
        }); 
      }
    }

    // --- 5B. API SVG Assets (Proxy & CDN Cache for FontCanvas Ornaments) ---
    if (url.pathname.startsWith('/api/svg-assets')) {
      try {
        const gasUrl = env.GAS_SVG_URL;
        const token = env.GAS_TOKEN || "$uperAm4n";
        if (!gasUrl) {
          return new Response(JSON.stringify({ error: "GAS_SVG_URL_NOT_CONFIGURED" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const action = (url.searchParams.get('action') || 'list').toLowerCase();
        const fileId = url.searchParams.get('id') || '';
        const refresh = url.searchParams.get('refresh') === 'true';
        const cache = caches.default;
        
        // Cache key based on url without 'refresh'
        const cacheUrl = new URL(url.toString());
        cacheUrl.searchParams.delete('refresh');
        const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });

        if (!refresh) {
          const cached = await cache.match(cacheKey);
          if (cached) {
            const h = new Headers(cached.headers);
            h.set('Access-Control-Allow-Origin', '*');
            return new Response(cached.body, { status: cached.status, headers: h });
          }
        }

        // Fetch from GAS
        const gasParams = new URLSearchParams();
        gasParams.set('action', action);
        gasParams.set('token', token);
        if (fileId) gasParams.set('id', fileId);
        if (url.searchParams.get('q')) gasParams.set('q', url.searchParams.get('q'));
        if (url.searchParams.get('raw')) gasParams.set('raw', url.searchParams.get('raw'));

        const targetGasUrl = `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}${gasParams.toString()}`;
        const gasRes = await fetch(targetGasUrl);

        if (!gasRes.ok) {
          return new Response(await gasRes.text(), {
            status: gasRes.status,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const gasBody = await gasRes.text();
        const resHeaders = new Headers();
        resHeaders.set('Access-Control-Allow-Origin', '*');
        resHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        if (action === 'get' || url.searchParams.get('raw') === 'true') {
          resHeaders.set('Content-Type', 'image/svg+xml; charset=utf-8');
        } else {
          resHeaders.set('Content-Type', gasRes.headers.get('content-type') || 'application/json');
        }
        resHeaders.set('X-Content-Type-Options', 'nosniff');
        // Cache list for 7 days (or until refresh), individual SVG content for 1 year
        const maxAge = action === 'get' ? 31536000 : 604800;
        resHeaders.set('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge}`);

        const responseToCache = new Response(gasBody, { headers: resHeaders });
        ctx.waitUntil(cache.put(cacheKey, responseToCache.clone()));

        return new Response(gasBody, { headers: resHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // --- 6. API Checkout & Trial (The Resetter Logic) ---
    if ((url.pathname.startsWith('/api/checkout') || url.pathname.startsWith('/api/claim-trial')) && request.method === 'POST') {
      try {
        const body = await request.json();
        // FIXED: Masukkan tier, usages, amount, fontName, dan fontId agar tidak undefined saat digunakan di mapping
        const { email, name, address, metadata, type, tier, usages, amount, fontName, fontId } = body;
        const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
        const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

        const transactionId = metadata?.order_id || `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // 1. Cari/Update User (Logic Resetter)
        const userCheckRes = await fetch(`${supabaseUrl}/rest/v1/fontbuyer?email=eq.${email}&select=id`, {
          headers: { 'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` }
        });
        const userCheckData = await userCheckRes.json();
        let targetUserId;

       if (userCheckData && userCheckData.length > 0) {
          targetUserId = userCheckData[0].id;
          
          // A. Update Profil fontbuyer
          await fetch(`${supabaseUrl}/rest/v1/fontbuyer?id=eq.${targetUserId}`, {
            method: 'PATCH',
            headers: { 
              'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 
              'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
              full_name: name || null, 
              address: address || null 
            })
          });

          // B. Update Password Auth ke Order ID Transaksi Baru
          await fetch(`${supabaseUrl}/auth/v1/admin/users/${targetUserId}`, {
            method: 'PUT',
            headers: { 
              'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 
              'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ password: transactionId })
          });

        } else {
          // Hanya user BARU yang dibuatkan password otomatis menggunakan Order ID
          const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: 'POST',
            headers: { 'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: transactionId, email_confirm: true })
          });
          const createData = await createRes.json();
          targetUserId = createData.id;

          if (targetUserId) {
            await fetch(`${supabaseUrl}/rest/v1/fontbuyer`, {
              method: 'POST',
              headers: { 
                'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 
                'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
              },
              body: JSON.stringify({ 
                id: targetUserId, 
                email: email, 
                full_name: name || null, 
                address: address || null 
              })
            });
          }
        }

        // 2. Masukkan ke font_history (Sinkronisasi Granular Tier)
        let historyEntries = [];
        const items = metadata?.cart_items || [];

        const checkIds = items.length > 0 
          ? items.map(i => i.id) 
          : [fontId || metadata?.font_id || metadata?.cart_items?.[0]?.id];
        
        if (type === 'trial' || (items.length > 0 && items.some(i => i.price === 0))) {
          const trialCheckRes = await fetch(
            `${supabaseUrl}/rest/v1/font_history?user_id=eq.${targetUserId}&download_type=eq.trial&font_id=in.(${checkIds.filter(id => !!id).join(',')})&select=id`,
            { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
          );
          const trialCheckData = await trialCheckRes.json();
          
          if (trialCheckData && trialCheckData.length > 0) {
            return new Response(JSON.stringify({ error: "TRIAL_ALREADY_CLAIMED" }), { 
              status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
          }
        }
        
        if (items.length > 0) {
          historyEntries = items.map(item => ({
            user_id: targetUserId,
            font_id: item.id, 
            download_type: item.price === 0 ? 'trial' : 'full',
            transaction_id: transactionId,
            tier: (item.tier || 'SOLO').toUpperCase(), // Menyimpan key: SOLO, SMALL_50K, PERSONAL, dsb.
            usages: item.usages || ['desktop'],
            metadata: { ...item.metadata, price_at_purchase: item.price } 
          }));
        } else {
          // FIXED: Ambil font_id dari body, metadata, atau item pertama di cart agar tidak default ke zeros (penyebab FK Violation)
          const finalFontId = fontId || metadata?.font_id || metadata?.cart_items?.[0]?.id;
          
          if (!finalFontId) {
             throw new Error("REQUIRED_FONT_ID_MISSING");
          }

          historyEntries = [{
            user_id: targetUserId,
            font_id: finalFontId,
            download_type: type === 'trial' ? 'trial' : 'full',
            transaction_id: transactionId,
            tier: (tier || 'SOLO').toUpperCase(),
            usages: usages || (type === 'trial' ? ['trial'] : ['desktop']),
            metadata: { ...metadata, price_at_purchase: amount || 0 }
          }];
        }

        const historyRes = await fetch(`${supabaseUrl}/rest/v1/font_history`, {
          method: 'POST',
          headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(historyEntries)
        });

        if (!historyRes.ok) throw new Error(`DB_INSERT_FAILED: ${await historyRes.text()}`);

        if (type !== 'trial' && items.length > 0) {
          ctx.waitUntil(triggerGasEmail(email, name, transactionId, items, env));
        }

        return new Response(JSON.stringify({ success: true, transactionId, userId: targetUserId }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { 
          status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // --- 6B. API Send Manual Coupon to Buyer (Subqi Admin Only) ---
    if (url.pathname === '/api/admin/send-coupon' && request.method === 'POST') {
      try {
        const authHeader = request.headers.get('Authorization');
        const user = await getSupabaseUser(authHeader, env);
        if (!user || !(await isUserAdmin(user.id, env))) {
          return new Response(JSON.stringify({ error: "ADMIN_ONLY_ACCESS" }), { status: 403 });
        }

        const body = await request.json();
        const { email, name, couponCode, discountText, validUntil, usageLimit } = body;

        const gasUrls = (env.GAS_WEBAPP_URL || "").split(',').map(u => u.trim()).filter(u => u);
        if (gasUrls.length === 0) throw new Error("GAS_URL_NOT_CONFIGURED");

        const payload = {
          type: "send_coupon",
          token: "$emogaAm4n_",
          email,
          name: name || "Customer",
          coupon_code: couponCode,
          discount_text: discountText,
          valid_until: validUntil,
          usage_limit: usageLimit,
          website_url: "https://subqistudio.com",
          foundry_name: "Subqi Studio"
        };

        const rotatedUrls = gasUrls.sort(() => Math.random() - 0.5);
        let isSent = false;

        for (const targetUrl of rotatedUrls) {
          try {
            const gasRes = await fetch(targetUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            const resText = await gasRes.text();
            if (resText === "SUCCESS") {
              isSent = true;
              break;
            }
          } catch (err) {
            console.error("GAS_SEND_COUPON_FAILED:", err.message);
          }
        }

        if (!isSent) throw new Error("FAILED_TO_DISPATCH_VIA_GAS");

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // --- 6C. API Cloudflare Web Analytics (Admin Only) ---
    if (url.pathname === '/api/admin/analytics' && request.method === 'GET') {
      try {
        const authHeader = request.headers.get('Authorization');
        const user = await getSupabaseUser(authHeader, env);
        if (!user || !(await isUserAdmin(user.id, env))) {
          return new Response(JSON.stringify({ error: "ADMIN_ONLY_ACCESS" }), { 
            status: 403, 
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
          });
        }

        const apiToken = env.CF_API_TOKEN;
        const zoneId = env.CF_ZONE_ID;
        const accountId = env.CF_ACCOUNT_ID || "5ce335e05c30bbab4c880244f839836f";

        if (!apiToken) {
          return new Response(JSON.stringify({ 
            error: "CF_API_TOKEN_MISSING", 
            message: "Harap set CF_API_TOKEN di Cloudflare Worker secrets atau wrangler.toml" 
          }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
          });
        }

        const days = parseInt(url.searchParams.get('days') || '7', 10);
        const dateSince = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const dateUntil = new Date().toISOString().split('T')[0];

        // Query GraphQL Cloudflare Analytics (Zone + Worker Invocations)
        const graphqlQuery = {
          query: `
            query GetAnalytics($zoneId: String!, $dateSince: String!, $dateUntil: String!, $accountTag: String!) {
              viewer {
                zones(filter: { zoneTag: $zoneId }) {
                 httpRequests1dGroups(limit: 30, filter: { date_geq: $dateSince, date_leq: $dateUntil }, orderBy: [date_DESC]) {
                    dimensions {
                      date
                    }
                    sum {
                      requests
                      bytes
                      pageViews
                      countryMap {
                        clientCountryName
                        requests
                      }
                    }
                    uniq {
                      uniques
                    }
                  }
                }
                accounts(filter: { accountTag: $accountTag }) {
                  workersInvocationsAdaptive(limit: 30, filter: { scriptName: "font", datetime_geq: "${dateSince}T00:00:00Z" }) {
                    sum {
                      subrequests
                      requests
                      errors
                    }
                    dimensions {
                      datetimeHour
                    }
                  }
                }
              }
            }
          `,
          variables: {
            zoneId: zoneId || "",
            accountTag: accountId,
            dateSince: dateSince,
            dateUntil: dateUntil
          }
        };

        const cfRes = await fetch('https://api.cloudflare.com/client/v4/graphql', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(graphqlQuery)
        });

        const cfData = await cfRes.json();
        return new Response(JSON.stringify(cfData), {
          headers: { 
            'Content-Type': 'application/json', 
            'Access-Control-Allow-Origin': '*' 
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    
    // --- 6D. API Admin Font ZIP Download (Inspect Buyer Package without license.txt) ---
    if (url.pathname.startsWith('/api/admin/download-font-zip')) {
      try {
        const authHeader = request.headers.get('Authorization');
        const user = await getSupabaseUser(authHeader, env);
        if (!user || !(await isUserAdmin(user.id, env))) {
          return new Response(JSON.stringify({ error: "ADMIN_ONLY_ACCESS" }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const fontId = url.searchParams.get('id');
        if (!fontId) {
          return new Response(JSON.stringify({ error: "FONT_ID_REQUIRED" }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
        const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

        const fontRes = await fetch(
          `${supabaseUrl}/rest/v1/fonts?id=eq.${encodeURIComponent(fontId)}&select=id,name,font_files,trial_file_url`,
          { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
        );
        const fonts = fontRes.ok ? await fontRes.json() : [];
        const font = fonts[0];
        if (!font) {
          return new Response(JSON.stringify({ error: "FONT_NOT_FOUND" }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const fontFilesToFetch = Array.isArray(font.font_files) && font.font_files.length > 0
          ? font.font_files
          : font.trial_file_url
          ? [font.trial_file_url]
          : [];

        if (fontFilesToFetch.length === 0) {
          return new Response(JSON.stringify({ error: "NO_FONT_FILES_IN_FONT" }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const zipFiles = await Promise.all(fontFilesToFetch.map(async (fName, index) => {
          const fileData = await fetchFileBuffer(fName, env);
          if (!fileData) return null;

          const isR2File = /^\d{10,}-/.test(fName);
          let finalFileName = "";

          if (isR2File) {
            finalFileName = fName.replace(/^\d+-/, '');
          } else {
            const ext = fileData.contentType?.includes('ttf') ? 'ttf' : 'otf';
            const cleanBase = (font.name || "Font").replace(/\s+/g, '_');
            finalFileName = fontFilesToFetch.length > 1
              ? `${cleanBase}_${index + 1}.${ext}`
              : `${cleanBase}.${ext}`;
          }

          return {
            name: finalFileName,
            content: fileData.body
          };
        }));

        const validFiles = zipFiles.filter(Boolean);
        if (validFiles.length === 0) {
          return new Response(JSON.stringify({ error: "FAILED_TO_FETCH_FONT_FILES" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const zipBuffer = createMultiZip(validFiles);

        const baseName = (font.name || 'Font')
          .replace(/(demo|regular|bold|italic|medium|light|thin|black|extrabold|semibold)/gi, '')
          .trim()
          .replace(/\s+/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        const zipName = `SQ_${baseName}.zip`;

        return new Response(zipBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${zipName}"`,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Expose-Headers': 'Content-Disposition'
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // --- 6E. API Admin Email Template Management ---
    if (url.pathname === '/api/admin/email-template') {
      try {
        const authHeader = request.headers.get('Authorization');
        const user = await getSupabaseUser(authHeader, env);
        if (!user || !(await isUserAdmin(user.id, env))) {
          return new Response(JSON.stringify({ error: "ADMIN_ONLY_ACCESS" }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
        const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

        if (request.method === 'GET') {
          let currentConfig = null;
          if (supabaseUrl && serviceRoleKey) {
            const sRes = await fetch(`${supabaseUrl}/rest/v1/site_settings?key=eq.email_template_order&select=value`, {
              headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` }
            });
            if (sRes.ok) {
              const sData = await sRes.json();
              if (sData?.[0]?.value) {
                currentConfig = typeof sData[0].value === 'string' ? JSON.parse(sData[0].value) : sData[0].value;
              }
            }
          }
          return new Response(JSON.stringify({
            template: { ...DEFAULT_EMAIL_TEMPLATE, ...(currentConfig || {}) },
            defaultTemplate: DEFAULT_EMAIL_TEMPLATE
          }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        if (request.method === 'POST') {
          const body = await request.json();
          const templateData = body.template || body;

          const upsertRes = await fetch(`${supabaseUrl}/rest/v1/site_settings`, {
            method: 'POST',
            headers: {
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
              key: 'email_template_order',
              value: templateData,
              updated_at: new Date().toISOString()
            })
          });

          if (!upsertRes.ok) throw new Error(await upsertRes.text());

          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // --- 6F. API Admin Send Test Email ---
    if (url.pathname === '/api/admin/send-test-email' && request.method === 'POST') {
      try {
        const authHeader = request.headers.get('Authorization');
        const user = await getSupabaseUser(authHeader, env);
        if (!user || !(await isUserAdmin(user.id, env))) {
          return new Response(JSON.stringify({ error: "ADMIN_ONLY_ACCESS" }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const body = await request.json();
        const targetEmail = body.targetEmail;
        if (!targetEmail) {
          return new Response(JSON.stringify({ error: "TARGET_EMAIL_REQUIRED" }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const dummyOrderId = `TEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const dummyItems = [
          {
            name: "Royal Grande (Commercial Test)",
            file: "RoyalGrande-Regular.otf",
            price: 25,
            tier: "SOLO (1 USER ONLY)"
          }
        ];

        const gasUrls = (env.GAS_WEBAPP_URL || "").split(',').map(u => u.trim()).filter(u => u);
        if (gasUrls.length === 0) throw new Error("GAS_URL_NOT_CONFIGURED");

        const templateConfig = body.templateConfig || DEFAULT_EMAIL_TEMPLATE;
        const renderedHtml = generateOrderEmailHtml({
          buyerEmail: targetEmail,
          buyerName: "Admin Tester",
          orderId: dummyOrderId,
          items: dummyItems,
          templateConfig,
          baseUrl: "https://subqi.com"
        });

        const subjectTemplate = templateConfig.subject || DEFAULT_EMAIL_TEMPLATE.subject;
        const finalSubject = `[TEST EMAIL] ` + subjectTemplate.replace(/\[ORDER_ID\]/g, dummyOrderId).replace(/\[BUYER_NAME\]/g, "Admin Tester");

        const payload = {
          token: "$emogaAm4n_",
          action: "order",
          email: targetEmail,
          name: "Admin Tester",
          order_id: dummyOrderId,
          subject: finalSubject,
          htmlBody: renderedHtml,
          sender_name: "Subqi Studio"
        };

        const rotatedUrls = gasUrls.sort(() => Math.random() - 0.5);
        let senderAccount = null;

        for (const targetUrl of rotatedUrls) {
          try {
            const res = await fetch(targetUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            const resText = await res.text();
            let resJson = null;
            try { resJson = JSON.parse(resText); } catch (_) {}

            if ((resJson && resJson.status === "SUCCESS") || resText === "SUCCESS" || resText.includes("Order Email Sent")) {
              senderAccount = resolveGasSender(resJson?.sender, targetUrl);
              break;
            }
          } catch (e) {
            console.error("Test email send failed for account:", e.message);
          }
        }

        if (!senderAccount) throw new Error("FAILED_TO_SEND_VIA_ALL_GAS_ACCOUNTS");

        return new Response(JSON.stringify({ success: true, sender: senderAccount }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // --- 6G. API Admin Resend Order Email ---
    if (url.pathname === '/api/admin/resend-order-email' && request.method === 'POST') {
      try {
        const authHeader = request.headers.get('Authorization');
        const user = await getSupabaseUser(authHeader, env);
        if (!user || !(await isUserAdmin(user.id, env))) {
          return new Response(JSON.stringify({ error: "ADMIN_ONLY_ACCESS" }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const body = await request.json();
        const orderId = body.orderId;
        if (!orderId) {
          return new Response(JSON.stringify({ error: "ORDER_ID_REQUIRED" }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
        const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

        const hRes = await fetch(
          `${supabaseUrl}/rest/v1/font_history?transaction_id=eq.${encodeURIComponent(orderId)}&select=id,user_id,font_id,download_type,tier,metadata`,
          { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
        );
        const orderRows = await hRes.json();
        if (!orderRows || orderRows.length === 0) {
          return new Response(JSON.stringify({ error: "ORDER_NOT_FOUND" }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const firstRow = orderRows[0];
        const bRes = await fetch(
          `${supabaseUrl}/rest/v1/fontbuyer?id=eq.${firstRow.user_id}&select=email,full_name`,
          { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
        );
        const buyerRows = await bRes.json();
        const buyer = buyerRows?.[0];
        if (!buyer?.email) throw new Error("BUYER_EMAIL_NOT_FOUND");

        // Fetch font names and files
        const fontIds = orderRows.map(r => r.font_id).filter(Boolean);
        const fRes = await fetch(
          `${supabaseUrl}/rest/v1/fonts?id=in.(${fontIds.join(',')})&select=id,name,font_files,trial_file_url`,
          { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
        );
        const fontRows = fRes.ok ? await fRes.json() : [];
        const fontMap = {};
        fontRows.forEach(f => { fontMap[f.id] = f; });

        const items = orderRows.map(r => {
          const f = fontMap[r.font_id];
          const files = Array.isArray(f?.font_files) && f.font_files.length > 0 ? f.font_files : [f?.trial_file_url || f?.name];
          return {
            name: f?.name || "Font",
            file: files[0],
            price: r.metadata?.price_at_purchase || 25,
            tier: r.tier || "SOLO"
          };
        });

        const result = await triggerGasEmail(buyer.email, buyer.full_name || "Creator", orderId, items, env);
        if (!result.success) throw new Error(result.error || "GAS_DISPATCH_FAILED");

        return new Response(JSON.stringify({ success: true, sender: result.sender }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // --- 6H. API Admin GAS Status & Remaining Daily Quota (0 quota cost check) ---
    if (url.pathname === '/api/admin/gas-status' && request.method === 'GET') {
      try {
        const authHeader = request.headers.get('Authorization');
        const user = await getSupabaseUser(authHeader, env);
        if (!user || !(await isUserAdmin(user.id, env))) {
          return new Response(JSON.stringify({ error: "ADMIN_ONLY_ACCESS" }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const gasUrls = (env.GAS_WEBAPP_URL || "").split(',').map(u => u.trim()).filter(u => u);
        const accounts = await Promise.all(gasUrls.map(async (targetUrl) => {
          const email = resolveGasSender(null, targetUrl);
          let quota = 100;
          let isOnline = false;

          try {
            // Check quota via lightweight GET request (costs 0 emails)
            const qRes = await fetch(targetUrl, { method: "GET" });
            if (qRes.ok) {
              isOnline = true;
              const qText = await qRes.text();
              try {
                const qJson = JSON.parse(qText);
                if (typeof qJson?.quota === 'number') quota = qJson.quota;
                else if (typeof qJson?.remainingDailyQuota === 'number') quota = qJson.remainingDailyQuota;
              } catch (_) {}
            }
          } catch (e) {
            console.error("GAS quota check error for:", email, e.message);
          }

          return {
            email,
            url: targetUrl,
            remaining: quota,
            limit: 100,
            status: isOnline ? "ONLINE" : "READY"
          };
        }));

        const totalRemaining = accounts.reduce((sum, acc) => sum + (acc.remaining || 0), 0);
        const totalLimit = accounts.length * 100;

        return new Response(JSON.stringify({
          accounts,
          totalRemaining,
          totalLimit
        }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // --- 7. API Secure ZIP Download (For Buyers) ---
    if (url.pathname.startsWith('/api/download-zip')) {
      const rawFile = url.searchParams.get('file') || ''; // AMBIL PARAM MENTAH
      const transactionId = url.searchParams.get('order'); 
      const injectedType = url.searchParams.get('type') || '';

      try {
        const authHeader = request.headers.get('Authorization');
        
        // FIXED: Ambil email dari parameter untuk verifikasi guest/existing user yang tidak login
        const email = url.searchParams.get('email');
        let isAuthorized = false;
        let buyerEmail = '';

        const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
        const supabaseKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
        const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

        let buyerName = 'N/A';
        let buyerAddress = 'N/A';

        // 1a. VERIFIKASI VIA TOKEN (Untuk User yang sedang Login)
        if (authHeader) {
          const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: { 'Authorization': authHeader, 'apikey': supabaseKey }
          });
          const userData = userRes.ok ? await userRes.json() : null;
          if (userData) {
            isAuthorized = true;
            buyerEmail = userData.email;
            
            // Jika ada order ID, ambil data pembeli asli untuk LICENSE.txt (agar admin download menghasilkan lisensi pembeli asli)
            if (transactionId && serviceRoleKey) {
              const hRes = await fetch(
                `${supabaseUrl}/rest/v1/font_history?transaction_id=eq.${encodeURIComponent(transactionId)}&select=user_id`,
                { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
              );
              const hRows = await hRes.json();
              if (hRows?.[0]?.user_id) {
                const bRes = await fetch(
                  `${supabaseUrl}/rest/v1/fontbuyer?id=eq.${hRows[0].user_id}&select=email,full_name,address`,
                  { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
                );
                const bRows = await bRes.json();
                if (bRows?.[0]) {
                  buyerEmail = bRows[0].email || buyerEmail;
                  buyerName = bRows[0].full_name || buyerName;
                  buyerAddress = bRows[0].address || buyerAddress;
                }
              }
            }

            if (buyerName === 'N/A') {
              // Ambil data profil user yang login untuk LICENSE.txt
              const profRes = await fetch(`${supabaseUrl}/rest/v1/fontbuyer?id=eq.${userData.id}&select=full_name,address`, {
                headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` }
              });
              const profData = await profRes.json();
              if (profData?.[0]) {
                buyerName = profData[0].full_name || 'N/A';
                buyerAddress = profData[0].address || 'N/A';
              }
            }
          }
        }

        let emailHistoryRecordToUpdate = null;

        // 1b. FALLBACK: VERIFIKASI VIA EMAIL + ORDER ID (Khusus Quick-Access link dari Email)
        // Aturan Keamanan: Maksimal 7 Hari ATAU Maksimal 7 Kali Download (mana saja yang lebih dulu)
        if (!isAuthorized && email && transactionId && serviceRoleKey) {
          const checkRes = await fetch(
            `${supabaseUrl}/rest/v1/font_history?transaction_id=eq.${encodeURIComponent(transactionId)}&select=id,user_id,download_date,metadata`,
            { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
          );
          const historyRows = await checkRes.json();
          
          if (historyRows && historyRows.length > 0 && historyRows[0].user_id) {
            const histRow = historyRows[0];
            const targetUserId = histRow.user_id;

            // 1. Cek Batas Waktu: Maksimal 7 Hari
            const purchaseTime = new Date(histRow.download_date).getTime();
            const now = Date.now();
            const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
            const isExpired = !isNaN(purchaseTime) && (now - purchaseTime) > SEVEN_DAYS_MS;

            // 2. Cek Batas Frekuensi: Maksimal 7 Kali Download via Email Link
            const currentMeta = histRow.metadata || {};
            const emailDownloadCount = typeof currentMeta.email_download_count === 'number' ? currentMeta.email_download_count : 0;
            const isLimitReached = emailDownloadCount >= 7;

            if (isExpired || isLimitReached) {
              const reasonText = isExpired
                ? "has expired (7-day validity window exceeded)"
                : "has reached the maximum download limit (7/7 downloads used)";

              return new Response(
                `<!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <title>Link Expired - Subqi Studio</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #EDEBE6; color: #111; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
                    .card { background: #fff; border: 2px solid #000; padding: 36px 28px; max-width: 480px; width: 100%; box-shadow: 6px 6px 0px #000; text-align: center; }
                    .badge { display: inline-block; background: #FF5C00; color: #000; font-weight: 900; font-size: 10px; text-transform: uppercase; padding: 4px 8px; border: 1px solid #000; margin-bottom: 16px; }
                    h1 { font-size: 22px; font-weight: 900; text-transform: uppercase; margin: 0 0 12px 0; font-style: italic; }
                    p { font-size: 13px; line-height: 1.6; color: #444; margin: 0 0 24px 0; }
                    .btn { display: inline-block; background: #000; color: #fff; padding: 14px 28px; text-decoration: none; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border: 2px solid #000; transition: all 0.2s; }
                    .btn:hover { background: #FF5C00; color: #000; }
                    .note { margin-top: 20px; font-size: 11px; color: #777; }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <span class="badge">Security Protection</span>
                    <h1>Download Link Expired</h1>
                    <p>This quick-access email link ${reasonText} to prevent unauthorized distribution.<br><br>Don't worry! You can log in to your <strong>User Vault</strong> anytime to download all your purchased fonts permanently without limits.</p>
                    <a href="https://subqi.com/user/auth" class="btn">Log In to User Vault</a>
                    <div class="note">Order ID: <strong>${transactionId}</strong></div>
                  </div>
                </body>
                </html>`,
                {
                  status: 403,
                  headers: { 'Content-Type': 'text/html; charset=utf-8' }
                }
              );
            }

            const buyerRes = await fetch(
              `${supabaseUrl}/rest/v1/fontbuyer?id=eq.${targetUserId}&select=email,full_name,address`,
              { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
            );
            const buyerRows = await buyerRes.json();
            const record = buyerRows?.[0];
            
            if (record && record.email?.toLowerCase().trim() === email.toLowerCase().trim()) {
              isAuthorized = true;
              buyerEmail = record.email;
              buyerName = record.full_name || 'N/A';
              buyerAddress = record.address || 'N/A';
              
              // Catat record untuk increment counter download
              emailHistoryRecordToUpdate = {
                id: histRow.id,
                currentCount: emailDownloadCount,
                metadata: currentMeta
              };
            }
          }
        }
// --- END FIX ---

        if (!isAuthorized) return new Response("UNAUTHORIZED_ACCESS", { status: 401 });

        // 2. Ekstrak dan Bersihkan Nama File (AGAR TIDAK REFERENCE ERROR)
        const fontFile = decodeURIComponent(rawFile).split('/').pop();
        const cleanFontName = fontFile.replace(/^\d+-/, ''); 
        // FIXED 1: Pindahkan pengambilan data DB ke sini agar isTrial tidak Reference Error
        let txData = {};
        let fontFilesToFetch = [fontFile];
        try {
          // 1. Identifikasi font_id berdasarkan file yang diminta agar item tidak tertukar
          const fontLookupRes = await fetch(
            `${supabaseUrl}/rest/v1/fonts?or=(font_files.cs.{${fontFile}},trial_file_url.eq.${fontFile})&select=id,name,font_files`,
            { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
          );
          const foundFonts = await fontLookupRes.json();
          const targetFont = foundFonts?.[0];

          if (targetFont) {
            txData.actual_name = targetFont.name;
            // 2. Ambil detail transaksi KHUSUS untuk font_id ini dalam Order ID tersebut
            const txRes = await fetch(
              `${supabaseUrl}/rest/v1/font_history?transaction_id=eq.${encodeURIComponent(transactionId)}&font_id=eq.${targetFont.id}&select=tier,usages,download_type,metadata`,
              { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
            );
            const txRows = txRes.ok ? await txRes.json() : [];
            txData = { ...txData, ...(txRows[0] || {}) };

            const typeStr = (injectedType || txData.download_type || '').toLowerCase();
            const isTrial = typeStr.includes('trial') || typeStr.includes('demo') || fontFile.toLowerCase().includes('trial');

            if (!isTrial && targetFont.font_files?.length > 0) {
              fontFilesToFetch = targetFont.font_files;
            }
          }
        } catch (e) { console.log("DB_LOOKUP_ERROR", e.message); }

        // FIXED 2: Tentukan status trial sebelum membuat zipName
        const typeStr = (injectedType || txData.download_type || '').toLowerCase();
        const isTrial = typeStr.includes('trial') || typeStr.includes('demo') || fontFile.toLowerCase().includes('trial');

        // FIXED 3: Naming ZIP Murni - Pertahankan Huruf Besar/Kecil dari Database
        const rawSource = txData.actual_name || cleanFontName.split('.')[0];
        
        const baseName = rawSource
          .replace(/(demo|regular|bold|italic|medium|light|thin|black|extrabold|semibold)/gi, '')
          .trim()
          .replace(/\s+/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');

        // Hapus .toLowerCase() agar Case Sensitive (Royal_Grande.zip)
        const zipName = `SQ_${baseName}${isTrial ? '_Trial' : ''}.zip`;
     

       // 3. MASTER TIER MAPPING (Sinkronisasi Frontend CartCard.tsx)
        const MASTER_TIER_LABELS = {
          desktop: { solo: '1 USER ONLY', team: 'UP TO 30 USER', studio: 'UP TO 100 USER', enterprise: 'UNLIMITED USER' },
          social_web: { small_50k: '50K VIEWS', medium_500k: '500K VIEWS', large_5m: '2M VIEWS', enterprise_unlimited: 'UNLIMITED VIEWS' },
          logo_branding: { personal: 'PERSONAL BRANDING', solo: '1-10 EMPLOYEES', team: '11-50 EMPLOYEES', studio: '51-250 EMPLOYEES', enterprise: '251+ EMPLOYEES' },
          app: { solo: '1 TITLE', team: 'UP TO 10 TITLES', studio: 'UP TO 50 TITLES', enterprise: 'UNLIMITED TITLES' },
          server: { solo: 'SINGLE', studio: 'UP TO 50 SERVERS', enterprise: 'UNLIMITED' },
          broadcast: { solo: 'REGIONAL', studio: 'NATIONAL', enterprise: 'WORLDWIDE' }
        };

        const rawTier = (txData.tier || 'solo').toLowerCase();
        const primaryUsage = isTrial ? 'trial' : (txData.usages?.[0] || 'desktop');
        
        let displayTier = '';
        if (isTrial) {
          displayTier = 'DEMO - PERSONAL USE ONLY';
        } else if (txData.tier === 'CORPORATE') {
          displayTier = 'CORPORATE - UNLIMITED ALL-IN-ONE';
        } else {
          // Ambil label spesifik dari kamus berdasarkan kategori lisensi utama
          const label = MASTER_TIER_LABELS[primaryUsage]?.[rawTier] || rawTier.toUpperCase();
          displayTier = `${rawTier.toUpperCase()} (${label})`;
        }

        const usages = isTrial ? ['trial'] : (txData.usages && txData.usages.length > 0 ? txData.usages : ['desktop']);

        const TEXT_DB = {
          trial: {
            title: "01. PERSONAL USE ONLY (DEMO)",
            grant: "Permitted exclusively for personal, non-commercial use (e.g. educational assignments, portfolio pieces, or non-profit testing).",
            charSet: "The Demo version is a trial asset and contains a limited glyph set.",
            restrictions: "Commercial utilization, business promotion, or revenue-generating activities are strictly prohibited."
          },
          desktop: "DESKTOP / PRINT: Install on workstations to create static visual content (PNG, JPG, PDF) for digital and print media.",
          social_web: "DIGITAL MEDIA (SOCIAL/WEB): Specifically for digital platforms, including website embedding and social media advertising.",
          logo_branding: "LOGO & BRANDING: Utilize the font as a core element of a visual identity system (Logos, Wordmarks).",
          app: "APP / GAME / EBOOK: Embed font software into mobile applications, software, games, or electronic publications.",
          broadcast: "BROADCAST: For motion graphics, television, cinema, streaming, and video advertisements.",
          server: "SERVER: Install on a server to facilitate automated end-user customization (Web-to-Print).",
          corporate: "CORPORATE ALL-IN-ONE: A comprehensive license covering all categories for an entire organization with no limits on seats or impressions."
        };

        // 4. Susun isi LICENSE.txt
        const issueDate = new Date().toLocaleDateString();
        let licenseBody = `SUBQI STUDIO — OFFICIAL LICENSE CERTIFICATE\n`;
        licenseBody += `========================================================================\n`;
        licenseBody += `ORDER ID       : ${transactionId || 'N/A'} (USE AS PASSWORD RESETTER)\n`;
        licenseBody += `LICENSE HOLDER : ${buyerEmail} (USERNAME)\n`;
        licenseBody += `LICENSEE NAME  : ${buyerName}\n`;
        licenseBody += `ADDRESS        : ${buyerAddress}\n`;
        licenseBody += `ISSUE DATE     : ${issueDate}\n`;
        const displayFontName = txData.actual_name || cleanFontName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        licenseBody += `ASSET NAME     : ${displayFontName}\n`;
        licenseBody += `------------------------------------------------------------------------\n\n`;

        licenseBody += `LICENSED USAGE TERMS:\n\n`;
        usages.forEach((u, i) => {
          if (isTrial) {
            licenseBody += `${i + 1}. ${TEXT_DB.trial.title}:\n`;
            licenseBody += `${TEXT_DB.trial.grant}\n\n`;
            licenseBody += `CHARACTER SET: ${TEXT_DB.trial.charSet}\n\n`;
            licenseBody += `RESTRICTIONS: ${TEXT_DB.trial.restrictions}\n\n`;
          } else {
            // FIXED: Masukkan Tier Label (misal: 1 User / Personal) ke dalam baris judul
            const specificLabel = MASTER_TIER_LABELS[u]?.[rawTier] || rawTier.toUpperCase();
            const title = `${u.replace('_', ' & ').toUpperCase()} LICENSE: ( ${specificLabel} )`;
            licenseBody += `${i + 1}. ${title}\n`;
            licenseBody += `${TEXT_DB[u] || TEXT_DB.desktop}\n\n`;
          }
        });


        licenseBody += `GENERAL RULES:\n`;
        licenseBody += `1. This license is non-transferable and belongs strictly to the buyer.\n`;
        licenseBody += `2. You may not sell, rent, sublicense, or redistribute the font files.\n`;
        licenseBody += `3. The font software remains the sole property of Subqi Studio.\n\n`;

        if (!isTrial) {
          licenseBody += `FONT CANVAS ACCESS (USER VAULT PERKS):\n`;
          licenseBody += `Your commercial license unlocks VIP access to our Font Canvas design suite:\n`;
          licenseBody += `• Portal Link : https://canvas.subqi.com\n`;
          licenseBody += `• Username    : ${buyerEmail}\n`;
          licenseBody += `• Order ID    : ${transactionId || 'N/A'} (Use as Password)\n`;
          licenseBody += `PERKS INCLUDED:\n`;
          licenseBody += `- Instant Unlock : All fonts you purchased are automatically unlocked in Canvas.\n`;
          licenseBody += `- Free Extras    : Enjoy free access to all font extras, ornaments & exclusive dingbats catalog-wide.\n`;
          licenseBody += `- Pro Features   : All creator features unlocked (Export, Save, Import & more).\n\n`;
        }

        licenseBody += `FULL DIGITAL RECEIPT:\nhttps://font.subqi.workers.dev/user/receipt/${transactionId} *LOGIN FIRST TO ACCESS*\n`;

        const licenseData = new TextEncoder().encode(licenseBody.trim());

        // 5. Gabungkan Font + LICENSE.txt ke dalam ZIP
        const zipFiles = await Promise.all(fontFilesToFetch.map(async (fName, index) => {
          // Gunakan fungsi helper fetchFileBuffer agar bisa ambil dari R2 atau Drive
          const fileData = await fetchFileBuffer(fName, env);
          if (!fileData) return null;
          
          // DETEKSI R2: Harus diawali timestamp (10+ angka) diikuti tanda hubung
          const isR2File = /^\d{10,}-/.test(fName);
          let finalFileName = "";

          if (isR2File) {
            finalFileName = fName.replace(/^\d+-/, '');
          } else {
            // JIKA DRIVE ID: Gunakan nama Typeface asli + Indeks
            // Paksa extension .ttf jika tipe generic untuk mendukung Variable Font di OS
            const ext = fileData.contentType?.includes('ttf') ? 'ttf' : 'otf';
            const cleanBase = (txData.actual_name || "Font").replace(/\s+/g, '_');
            
            finalFileName = fontFilesToFetch.length > 1 
              ? `${cleanBase}_${index + 1}.${ext}` 
              : `${cleanBase}.${ext}`;
          }

          return { name: finalFileName, content: fileData.body };
        }));

        // Gabungkan seluruh font family + LICENSE.txt
        const validFiles = zipFiles.filter(f => f !== null);
        validFiles.push({ name: 'LICENSE.txt', content: licenseData });

        const zipData = createMultiZip(validFiles);

        const headers = new Headers();
        headers.set('Content-Type', 'application/zip');
        headers.set('Content-Disposition', `attachment; filename="${zipName}"`);
        // EXPOSE HEADERS: Agar frontend bisa membaca nama file asli
        headers.set('Access-Control-Expose-Headers', 'Content-Disposition');
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('X-License-Owner', buyerEmail);
        headers.set('X-Order-ID', transactionId || 'N/A');
        // Jika diunduh via quick-access link email, catat dan tambahkan counter unduhan (+1)
        if (emailHistoryRecordToUpdate && serviceRoleKey) {
          ctx.waitUntil((async () => {
            try {
              const nextCount = emailHistoryRecordToUpdate.currentCount + 1;
              const updatedMeta = { ...emailHistoryRecordToUpdate.metadata, email_download_count: nextCount };
              await fetch(`${supabaseUrl}/rest/v1/font_history?id=eq.${emailHistoryRecordToUpdate.id}`, {
                method: 'PATCH',
                headers: {
                  'apikey': serviceRoleKey,
                  'Authorization': `Bearer ${serviceRoleKey}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ metadata: updatedMeta })
              });
            } catch (err) {
              console.error("Failed to increment email download count:", err);
            }
          })());
        }

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

        // 1. Cari User ID berdasarkan Email (Case-Insensitive menggunakan ilike)
        const buyerRes = await fetch(
          `${supabaseUrl}/rest/v1/fontbuyer?email=ilike.${encodeURIComponent(email)}&select=id`,
          { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
        );
        const buyerData = await buyerRes.json();
        const foundUserId = buyerData?.[0]?.id;

        if (!foundUserId) {
          return new Response(JSON.stringify({ error: "INVALID_ORDER_OR_EMAIL" }), { 
            status: 403,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        // 2. Verifikasi apakah Transaction ID yang diinput ada di sejarah transaksi User tersebut
        const checkRes = await fetch(
          `${supabaseUrl}/rest/v1/font_history?user_id=eq.${foundUserId}&transaction_id=eq.${encodeURIComponent(transactionId)}&select=user_id`,
          { headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` } }
        );
        const checkData = await checkRes.json();

        if (!checkData || checkData.length === 0) {
          return new Response(JSON.stringify({ error: "TRANSACTION_ID_NOT_FOUND" }), { 
            status: 403,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const userId = foundUserId;

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