import "server-only";
import nodemailer from "nodemailer";
import type { GnsecContainer } from "./gnsec";

export function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function transport() {
  const port = Number(process.env.SMTP_PORT ?? 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export async function sendEncryptedFile(opts: {
  to: string;
  container: GnsecContainer;
  senderName: string;
  message?: string;
}) {
  const filename = `${opts.container.meta.originalName}.gnsec`;
  const isPassword = opts.container.mode === "password";
  const lines = [
    `🔒 ${opts.senderName} sent you an encrypted file via gustavoneves.dev`,
    "",
    opts.message ? `Message: "${opts.message}"` : "",
    "",
    `Original file: ${opts.container.meta.originalName} (${opts.container.meta.size} bytes)`,
    "",
    "How to open it:",
    "  1. Save the attached .gnsec file.",
    "  2. Go to gustavoneves.dev → boot the system → open the Decrypt app.",
    isPassword
      ? "  3. Upload the file and enter the password the sender shared with you."
      : "  3. Upload the file and paste your private key (vault file — owner only).",
    "",
    "The file is end-to-end encrypted. This email alone cannot open it.",
  ].filter(Boolean);

  await transport().sendMail({
    from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
    to: opts.to,
    subject: `🔒 Encrypted file from ${opts.senderName}`,
    text: lines.join("\n"),
    attachments: [
      {
        filename,
        content: Buffer.from(JSON.stringify(opts.container)),
        contentType: "application/octet-stream",
      },
    ],
  });
}
