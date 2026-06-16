import { NextResponse } from "next/server";
import { z } from "zod";
import { encryptToContainer, isCryptoConfigured } from "@/lib/crypto-server";
import { isMailConfigured, sendEncryptedFile } from "@/lib/mailer";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import type { GnsecMode } from "@/lib/gnsec";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const fieldsSchema = z.object({
  mode: z.enum(["vault", "password"]),
  recipient: z.string().email().optional().or(z.literal("")),
  password: z.string().min(8).max(200).optional().or(z.literal("")),
  senderName: z.string().max(60).optional(),
  message: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  if (!isCryptoConfigured()) {
    return NextResponse.json(
      { error: "Encryption isn't configured on the server (missing RSA_PUBLIC_KEY)." },
      { status: 503 },
    );
  }

  const ip = clientIp(req);
  if (!rateLimit(`send:${ip}`, 5, 60_000).ok) {
    return NextResponse.json({ error: "Too many uploads. Wait a minute." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 8 MB)." }, { status: 413 });
  }

  let fields: z.infer<typeof fieldsSchema>;
  try {
    fields = fieldsSchema.parse({
      mode: form.get("mode"),
      recipient: form.get("recipient") ?? "",
      password: form.get("password") ?? "",
      senderName: form.get("senderName") ?? "",
      message: form.get("message") ?? "",
    });
  } catch {
    return NextResponse.json({ error: "Invalid fields." }, { status: 400 });
  }

  const mode = fields.mode as GnsecMode;
  if (mode === "password" && !fields.password) {
    return NextResponse.json({ error: "Password mode requires a password." }, { status: 400 });
  }
  if (mode === "password" && !fields.recipient) {
    return NextResponse.json({ error: "Add a recipient email." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let container;
  try {
    container = encryptToContainer(buffer, {
      mode,
      password: fields.password || undefined,
      originalName: file.name || "file",
      mime: file.type || "application/octet-stream",
    });
  } catch {
    return NextResponse.json({ error: "Encryption failed." }, { status: 500 });
  }

  const senderName = fields.senderName?.trim() || "Someone";
  const target = mode === "vault" ? process.env.MAIL_TO : fields.recipient;

  // No SMTP configured (e.g. local dev): return the encrypted container so the
  // flow can still be tested. The container is ciphertext — safe to hand back.
  if (!isMailConfigured() || !target) {
    return NextResponse.json({
      ok: true,
      emailed: false,
      mode,
      filename: `${container.meta.originalName}.gnsec`,
      container,
      note: !target
        ? "No destination configured (MAIL_TO). Returning the encrypted file."
        : "Email isn't configured. Returning the encrypted file (dev mode).",
    });
  }

  try {
    await sendEncryptedFile({
      to: target,
      container,
      senderName,
      message: fields.message,
    });
  } catch {
    return NextResponse.json({ error: "Encrypted, but the email failed to send." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, emailed: true, mode });
}
