import { NextResponse } from "next/server";
import { unwrapWithServerKey } from "@/lib/crypto-server";
import { isGnsecWrap } from "@/lib/gnsec";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * Removes the outer server layer of a .gnsec2 file, returning the inner blob
 * (still client-encrypted) as base64. The server never sees plaintext.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`unwrap:${ip}`, 20, 60_000).ok) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!isGnsecWrap(body)) {
    return NextResponse.json({ error: "Não é um arquivo .gnsec2 válido." }, { status: 400 });
  }

  try {
    const inner = unwrapWithServerKey(body);
    return NextResponse.json({
      inner: inner.toString("base64"),
      innerName: body.meta.innerName,
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível remover a camada externa." }, { status: 400 });
  }
}
