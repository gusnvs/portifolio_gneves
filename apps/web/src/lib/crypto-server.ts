import "server-only";
import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash,
  publicEncrypt,
  pbkdf2Sync,
  constants,
} from "node:crypto";
import { bytesToB64, b64ToBytes, type GnsecContainer, type GnsecMode, type GnsecWrap } from "./gnsec";

const PBKDF2_ITERATIONS = 210_000;

/* ----- outer server-side layer (symmetric, key derived from SESSION_SECRET) -- */

function serverWrapKey(): Buffer {
  const secret = process.env.SESSION_SECRET ?? "dev-only-insecure-session-secret-change-me-1234567890";
  return createHash("sha256").update(`${secret}:gnsec-wrap`).digest();
}

/** Wraps an already-encrypted inner blob with the server's symmetric key. */
export function wrapWithServerKey(inner: Buffer, innerName: string): GnsecWrap {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", serverWrapKey(), iv);
  const enc = Buffer.concat([cipher.update(inner), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: 1,
    app: "gnsec-wrap",
    iv: bytesToB64(iv),
    ciphertext: bytesToB64(Buffer.concat([enc, tag])),
    meta: { innerName, size: inner.length },
  };
}

/** Removes the outer server layer, returning the inner (still client-encrypted) blob. */
export function unwrapWithServerKey(wrap: GnsecWrap): Buffer {
  const all = Buffer.from(b64ToBytes(wrap.ciphertext));
  const tag = all.subarray(all.length - 16);
  const enc = all.subarray(0, all.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", serverWrapKey(), Buffer.from(b64ToBytes(wrap.iv)));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]);
}

export function isCryptoConfigured() {
  return Boolean(process.env.RSA_PUBLIC_KEY);
}

function getPublicKeyPem(): string {
  const raw = process.env.RSA_PUBLIC_KEY;
  if (!raw) throw new Error("RSA_PUBLIC_KEY is not set.");
  // We store the PEM as base64 in env. Support a raw (escaped-newline) PEM too.
  if (raw.includes("BEGIN PUBLIC KEY")) return raw.replace(/\\n/g, "\n");
  return Buffer.from(raw, "base64").toString("utf8");
}

/** Encrypt a file into a .gnsec container. */
export function encryptToContainer(
  data: Buffer,
  opts: { mode: GnsecMode; password?: string; originalName: string; mime: string },
): GnsecContainer {
  const iv = randomBytes(12);

  let aesKey: Buffer;
  let kdf: GnsecContainer["kdf"];
  if (opts.mode === "password") {
    if (!opts.password) throw new Error("Password required for password mode.");
    const salt = randomBytes(16);
    aesKey = pbkdf2Sync(opts.password, salt, PBKDF2_ITERATIONS, 32, "sha256");
    kdf = { salt: bytesToB64(salt), iterations: PBKDF2_ITERATIONS };
  } else {
    aesKey = randomBytes(32);
  }

  const cipher = createCipheriv("aes-256-gcm", aesKey, iv);
  const enc = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  const ciphertext = Buffer.concat([enc, tag]); // tag appended → WebCrypto-compatible

  const ownerKey = publicEncrypt(
    { key: getPublicKeyPem(), padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
    aesKey,
  );

  return {
    v: 1,
    app: "gnsec",
    mode: opts.mode,
    alg: {
      cipher: "AES-256-GCM",
      asym: "RSA-OAEP-SHA256",
      ...(opts.mode === "password" ? { kdf: "PBKDF2-SHA256" as const } : {}),
    },
    iv: bytesToB64(iv),
    ciphertext: bytesToB64(ciphertext),
    ownerKey: bytesToB64(ownerKey),
    ...(kdf ? { kdf } : {}),
    meta: { originalName: opts.originalName, mime: opts.mime, size: data.length },
  };
}
