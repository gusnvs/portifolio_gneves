/**
 * The .gnsec encrypted container — shared shape used by the server (encrypt)
 * and the browser (decrypt). Hybrid scheme:
 *   - file encrypted with AES-256-GCM (tag appended to ciphertext, WebCrypto-style)
 *   - the AES key is wrapped with RSA-OAEP(SHA-256) to the owner's public key
 *     (`ownerKey`) so the owner can always decrypt with their private key
 *   - in "password" mode the AES key is derived from a password via PBKDF2 too,
 *     so a recipient can decrypt with the shared password
 */

export type GnsecMode = "vault" | "password";

export type GnsecContainer = {
  v: 1;
  app: "gnsec";
  mode: GnsecMode;
  alg: {
    cipher: "AES-256-GCM";
    asym: "RSA-OAEP-SHA256";
    kdf?: "PBKDF2-SHA256";
  };
  iv: string; // base64 (12 bytes)
  ciphertext: string; // base64 (AES-GCM ciphertext WITH 16-byte tag appended)
  ownerKey: string; // base64 RSA-OAEP(aesKeyRaw)
  kdf?: { salt: string; iterations: number }; // present in "password" mode
  meta: { originalName: string; mime: string; size: number };
};

export function isGnsecContainer(value: unknown): value is GnsecContainer {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return c.app === "gnsec" && typeof c.iv === "string" && typeof c.ciphertext === "string";
}

/**
 * Outer server-side layer (.gnsec2). It wraps an already client-encrypted
 * inner blob with a server-held symmetric key (AES-256-GCM), so the file that
 * travels in the HTTP request / email is ciphertext on BOTH layers.
 */
export type GnsecWrap = {
  v: 1;
  app: "gnsec-wrap";
  iv: string; // base64
  ciphertext: string; // base64 (AES-GCM of the inner blob, tag appended)
  meta: { innerName: string; size: number };
};

export function isGnsecWrap(value: unknown): value is GnsecWrap {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return c.app === "gnsec-wrap" && typeof c.iv === "string" && typeof c.ciphertext === "string";
}

/* --- isomorphic base64 (Node Buffer or browser btoa/atob) --------------- */

export function bytesToB64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function b64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(b64, "base64"));
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
