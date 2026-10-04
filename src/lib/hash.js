export async function sha256hex(text) {
  try {
    const subtle = globalThis.crypto && globalThis.crypto.subtle;
    if (subtle) {
      const data = new TextEncoder().encode(String(text));
      const digest = await subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch (e) {
    /* fall through to the offline-safe hash below */
  }
  return fallbackHash(String(text));
}

// Used only when Web Crypto is unavailable (e.g. plain-http LAN preview).
function fallbackHash(text) {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 + c + i, 2246822519) >>> 0;
  }
  let out = '';
  for (let i = 0; i < 8; i += 1) {
    h1 = Math.imul(h1 ^ (h1 >>> 13), 3266489917) >>> 0;
    h2 = Math.imul(h2 ^ (h2 >>> 16), 668265263) >>> 0;
    out += (h1 ^ h2).toString(16).padStart(8, '0');
  }
  return `fb${out}`;
}
