/** Browser-side decryption (WebCrypto). The private key / password never leave
 *  the page. Also runs in Node 20+ via the global Web Crypto API. */
import { b64ToBytes, type GnsecContainer } from "./gnsec";

function pemToDer(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  if (!body) throw new Error("That doesn't look like a PEM key.");
  return b64ToBytes(body);
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const der = pemToDer(pem);
  return crypto.subtle.importKey(
    "pkcs8",
    der as unknown as ArrayBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"],
  );
}

async function aesGcmDecrypt(container: GnsecContainer, aesRaw: ArrayBuffer): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", aesRaw, { name: "AES-GCM" }, false, ["decrypt"]);
  const iv = b64ToBytes(container.iv);
  const ct = b64ToBytes(container.ciphertext);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as unknown as ArrayBuffer, tagLength: 128 },
    key,
    ct as unknown as ArrayBuffer,
  );
  return new Uint8Array(plain);
}

/** Owner path — decrypt any container with the RSA private key (PEM). */
export async function decryptWithPrivateKey(
  container: GnsecContainer,
  privateKeyPem: string,
): Promise<Uint8Array> {
  const priv = await importPrivateKey(privateKeyPem);
  const aesRaw = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    priv,
    b64ToBytes(container.ownerKey) as unknown as ArrayBuffer,
  );
  return aesGcmDecrypt(container, aesRaw);
}

/** Recipient path — decrypt a "password" container with the shared password. */
export async function decryptWithPassword(
  container: GnsecContainer,
  password: string,
): Promise<Uint8Array> {
  if (!container.kdf) throw new Error("This file has no password — it's vault-only.");
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password) as unknown as ArrayBuffer,
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const aesRaw = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: b64ToBytes(container.kdf.salt) as unknown as ArrayBuffer,
      iterations: container.kdf.iterations,
      hash: "SHA-256",
    },
    baseKey,
    256,
  );
  return aesGcmDecrypt(container, aesRaw);
}

/** A strong, human-shareable password generated in the browser. */
export function generatePassword(length = 22): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789-_";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) out += chars[bytes[i] % chars.length];
  return out;
}
