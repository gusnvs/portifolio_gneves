import { readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3216";
const priv = readFileSync(new URL("../../../keys/private_key.pem", import.meta.url), "utf8");

const b64ToBytes = (b64) => new Uint8Array(Buffer.from(b64, "base64"));
const bytesToB64 = (u8) => Buffer.from(u8).toString("base64");
const pemToDer = (pem) =>
  b64ToBytes(pem.replace(/-----BEGIN [^-]+-----/g, "").replace(/-----END [^-]+-----/g, "").replace(/\s+/g, ""));

let pass = 0, fail = 0;
const check = (label, cond) => { console.log(`${cond ? "✅" : "❌"} ${label}`); cond ? pass++ : fail++; };

// --- client-side encrypt to public key (mirrors encryptToVault) ---
async function encryptToVault(data, name, mime, pubPem) {
  const pub = await crypto.subtle.importKey("spki", pemToDer(pubPem), { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]);
  const aesRaw = crypto.getRandomValues(new Uint8Array(32));
  const aesKey = await crypto.subtle.importKey("raw", aesRaw, { name: "AES-GCM" }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, data));
  const ownerKey = new Uint8Array(await crypto.subtle.encrypt({ name: "RSA-OAEP" }, pub, aesRaw));
  return { v: 1, app: "gnsec", mode: "vault", alg: { cipher: "AES-256-GCM", asym: "RSA-OAEP-SHA256" },
    iv: bytesToB64(iv), ciphertext: bytesToB64(ct), ownerKey: bytesToB64(ownerKey),
    meta: { originalName: name, mime, size: data.length } };
}

async function decryptWithPriv(container) {
  const p = await crypto.subtle.importKey("pkcs8", pemToDer(priv), { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]);
  const aesRaw = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, p, b64ToBytes(container.ownerKey));
  const key = await crypto.subtle.importKey("raw", aesRaw, { name: "AES-GCM" }, false, ["decrypt"]);
  return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToBytes(container.iv), tagLength: 128 }, key, b64ToBytes(container.ciphertext)));
}

const original = "Documento secreto do Gustavo — 12345 ❄️ dupla camada";

// 1) get public key
const pk = await (await fetch(BASE + "/api/pubkey")).json();
check("GET /api/pubkey returns a public key", typeof pk.publicKey === "string" && pk.publicKey.includes("PUBLIC KEY"));

// 2) Encriptar (client) -> inner .gnsec
const inner = await encryptToVault(new TextEncoder().encode(original), "doc.txt", "text/plain", pk.publicKey);
check("Encriptar produced an inner gnsec (vault)", inner.app === "gnsec" && inner.mode === "vault");

// 3) Enviar (server) -> outer .gnsec2 (request body is already ciphertext)
const fd = new FormData();
fd.set("file", new Blob([JSON.stringify(inner)], { type: "application/octet-stream" }), "doc.txt.gnsec");
fd.set("senderName", "Tester");
const sendRes = await fetch(BASE + "/api/send", { method: "POST", body: fd });
const sendData = await sendRes.json();
check(`Enviar wrapped it (status ${sendRes.status}, emailed=${sendData.emailed})`, sendRes.ok && sendData.wrap?.app === "gnsec-wrap");

// 4) Descriptografar: server unwrap -> client decrypt
const unwrapRes = await fetch(BASE + "/api/unwrap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sendData.wrap) });
const unwrapData = await unwrapRes.json();
check(`/api/unwrap removed outer layer (status ${unwrapRes.status})`, unwrapRes.ok && typeof unwrapData.inner === "string");
const innerBack = JSON.parse(new TextDecoder().decode(b64ToBytes(unwrapData.inner)));
check("unwrapped inner equals original inner", innerBack.ciphertext === inner.ciphertext);
const out = new TextDecoder().decode(await decryptWithPriv(innerBack));
check("final decrypted content matches original", out === original);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
