const TRANSPORT_KEY = import.meta.env.VITE_CREDENTIALS_TRANSPORT_KEY;

const base64ToBytes = base64 => Uint8Array.from(atob(base64), c => c.charCodeAt(0));

const bytesToBase64 = bytes => {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';

  const CHUNK = 0x8000;
  for (let i = 0; i < arr.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, arr.subarray(i, i + CHUNK));
  }
  return btoa(binary);
};

let cachedKey = null;

const getKey = async () => {
  if (cachedKey) return cachedKey;
  if (!TRANSPORT_KEY) {
    throw new Error('VITE_CREDENTIALS_TRANSPORT_KEY is not configured');
  }
  const raw = base64ToBytes(TRANSPORT_KEY);
  if (raw.length !== 32) {
    throw new Error('VITE_CREDENTIALS_TRANSPORT_KEY must be 32 bytes (base64 of 32 bytes)');
  }
  cachedKey = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
  return cachedKey;
};

export const encryptForTransport = async value => {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return { iv: bytesToBase64(iv), ct: bytesToBase64(ciphertext) };
};

export const decryptFromTransport = async payload => {
  if (!payload?.iv || !payload?.ct) {
    throw new Error('Invalid encrypted payload');
  }
  const key = await getKey();
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(payload.iv) }, key, base64ToBytes(payload.ct));
  return JSON.parse(new TextDecoder().decode(plaintext));
};
