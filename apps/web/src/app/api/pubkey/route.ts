import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Serves the RSA public key (PEM) for client-side encryption. Public by design. */
export async function GET() {
  const raw = process.env.RSA_PUBLIC_KEY;
  if (!raw) {
    return NextResponse.json({ error: "Encryption isn't configured." }, { status: 503 });
  }
  const pem = raw.includes("BEGIN")
    ? raw.replace(/\\n/g, "\n")
    : Buffer.from(raw, "base64").toString("utf8");
  return NextResponse.json({ publicKey: pem });
}
