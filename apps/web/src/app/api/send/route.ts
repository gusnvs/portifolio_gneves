import { NextResponse } from "next/server";
import { z } from "zod";
import { wrapWithServerKey } from "@/lib/crypto-server";
import { isMailConfigured, sendWrappedFile } from "@/lib/mailer";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// The uploaded file is ALREADY client-encrypted, so it can be a bit larger.
const MAX_BYTES = 12 * 1024 * 1024;

const fieldsSchema = z.object({
  recipient: z.string().email().optional().or(z.literal("")),
  senderName: z.string().max(60).optional(),
  message: z.string().max(500).optional(),
});

/**
 * Receives an ALREADY client-encrypted file (.gnsec), adds the outer server
 * layer (.gnsec2) and emails it. The request body never carries plaintext.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`send:${ip}`, 5, 60_000).ok) {
    return NextResponse.json({ error: "Muitos envios. Aguarde um minuto." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Form inválido." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Arquivo grande demais (máx. 12 MB)." }, { status: 413 });
  }

  let fields: z.infer<typeof fieldsSchema>;
  try {
    fields = fieldsSchema.parse({
      recipient: form.get("recipient") ?? "",
      senderName: form.get("senderName") ?? "",
      message: form.get("message") ?? "",
    });
  } catch {
    return NextResponse.json({ error: "Campos inválidos." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const wrap = wrapWithServerKey(buffer, file.name || "arquivo.gnsec");
  const senderName = fields.senderName?.trim() || "Alguém";
  const target = fields.recipient || process.env.MAIL_TO;

  // No SMTP / no destination (dev): return the wrapped container to download.
  if (!isMailConfigured() || !target) {
    return NextResponse.json({
      ok: true,
      emailed: false,
      filename: `${(file.name || "arquivo").replace(/\.gnsec$/i, "")}.gnsec2`,
      wrap,
      note: !target
        ? "Sem destino configurado (MAIL_TO). Devolvendo o arquivo de dupla camada."
        : "Email não configurado. Devolvendo o arquivo de dupla camada (dev).",
    });
  }

  try {
    await sendWrappedFile({ to: target, wrap, senderName, message: fields.message });
  } catch {
    return NextResponse.json({ error: "Criptografado, mas o email falhou." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, emailed: true });
}
