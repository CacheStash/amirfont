/**
 * SECURE FONT LOADER (Client-side Decryption & Blob Injector)
 * 
 * Protects commercial fonts from direct downloading/ripping via DevTools.
 * Font binaries fetched from /api/fonts are masked on the server.
 * This helper unmasks them in browser memory and mounts them via FontFace and opentype.js.
 */
import opentype from 'opentype.js';

// Secret key stream mask for Subqifont
const CIPHER_KEY = [0x53, 0x75, 0x62, 0x71, 0x69, 0x46, 0x6F, 0x6E, 0x74, 0x56, 0x61, 0x75, 0x6C, 0x74, 0x32, 0x36];
const MASK_LENGTH = 512;

/**
 * Unmasks the protected font ArrayBuffer in memory.
 */
export function unmaskFontBuffer(buffer: ArrayBuffer): ArrayBuffer {
  const bytes = new Uint8Array(buffer);
  const limit = Math.min(bytes.length, MASK_LENGTH);
  const keyLen = CIPHER_KEY.length;

  for (let i = 0; i < limit; i++) {
    bytes[i] ^= CIPHER_KEY[i % keyLen];
  }

  return bytes.buffer;
}

// Memory cache of decrypted blob URLs to prevent duplicate network requests
const blobUrlCache = new Map<string, string>();
const fontPromiseCache = new Map<string, Promise<ArrayBuffer>>();

/**
 * Fetches, unmasks, and creates an ephemeral Blob URL in memory.
 */
export async function getDecryptedFontBlobUrl(url: string): Promise<string> {
  if (blobUrlCache.has(url)) {
    return blobUrlCache.get(url)!;
  }

  const rawBuffer = await fetchAndDecryptFont(url);
  const blob = new Blob([rawBuffer], { type: 'font/opentype' });
  const blobUrl = URL.createObjectURL(blob);
  blobUrlCache.set(url, blobUrl);
  return blobUrl;
}

/**
 * Fetches and decrypts the font buffer.
 */
export async function fetchAndDecryptFont(url: string): Promise<ArrayBuffer> {
  if (fontPromiseCache.has(url)) {
    return fontPromiseCache.get(url)!;
  }

  const promise = (async () => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch protected font: ${res.status}`);
    }
    const encryptedBuffer = await res.arrayBuffer();
    return unmaskFontBuffer(encryptedBuffer);
  })();

  fontPromiseCache.set(url, promise);
  return promise;
}

/**
 * Loads a protected font into document.fonts and registers @font-face via FontFace API.
 */
export async function loadProtectedFontFace(familyName: string, url: string): Promise<void> {
  try {
    const blobUrl = await getDecryptedFontBlobUrl(url);
    const fontFace = new FontFace(familyName, `url("${blobUrl}")`, {
      display: 'swap'
    });
    const loadedFace = await fontFace.load();
    document.fonts.add(loadedFace);
  } catch (err) {
    console.error(`Failed to register protected FontFace: ${familyName}`, err);
  }
}

/**
 * Parses a protected font directly into an OpenType.js Font object from memory.
 */
export async function loadProtectedOpenType(url: string): Promise<opentype.Font> {
  const buffer = await fetchAndDecryptFont(url);
  return opentype.parse(buffer);
}
