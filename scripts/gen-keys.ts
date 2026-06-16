/**
 * Generates an RSA-4096 keypair for the "vault" encryption flow.
 *
 *   pnpm gen:keys
 *
 * - Writes keys/private_key.pem and keys/public_key.pem (the `keys/` folder is
 *   gitignored — keep the PRIVATE key safe and never deploy it).
 * - Prints a base64 RSA_PUBLIC_KEY line to paste into your .env (server-side).
 *
 * To decrypt a vault file later, open the Decrypt app and paste the contents of
 * keys/private_key.pem. The private key never leaves your browser.
 */
import { generateKeyPairSync } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const outDir = path.resolve(process.cwd(), "keys");
mkdirSync(outDir, { recursive: true });

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 4096,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

writeFileSync(path.join(outDir, "public_key.pem"), publicKey, { mode: 0o600 });
writeFileSync(path.join(outDir, "private_key.pem"), privateKey, { mode: 0o600 });

const base64Public = Buffer.from(publicKey, "utf8").toString("base64");

console.log("\n✅ RSA-4096 keypair generated in ./keys/\n");
console.log("   keys/public_key.pem   → safe to share / used by the server");
console.log("   keys/private_key.pem  → SECRET. Keep it. Never commit or deploy it.\n");
console.log("Add this line to your apps/web/.env (and your server's environment):\n");
console.log(`RSA_PUBLIC_KEY=${base64Public}\n`);
console.log("To decrypt a vault file, paste keys/private_key.pem into the Decrypt app.\n");
