import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import {
  isS3Configured,
  listDir,
  createFolder,
  presignUpload,
  presignDownload,
  deleteEntry,
  renameEntry,
} from "@/lib/s3";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const pathStr = z.string().max(1024);

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!isS3Configured()) {
    return NextResponse.json({ error: "AWS S3 não configurado.", notConfigured: true }, { status: 503 });
  }
  if (!rateLimit(`cloud:${clientIp(req)}`, 80, 60_000).ok) {
    return NextResponse.json({ error: "Muitas requisições." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  try {
    switch (body.action) {
      case "list":
        return NextResponse.json({ entries: await listDir(pathStr.parse(body.prefix ?? "")) });
      case "folder":
        await createFolder(pathStr.parse(body.path));
        return NextResponse.json({ ok: true });
      case "upload-url":
        return NextResponse.json({
          url: await presignUpload(
            pathStr.parse(body.path),
            z.string().max(200).parse(body.contentType ?? "application/octet-stream"),
          ),
        });
      case "download-url":
        return NextResponse.json({ url: await presignDownload(pathStr.parse(body.path)) });
      case "delete":
        await deleteEntry(pathStr.parse(body.path), Boolean(body.isFolder));
        return NextResponse.json({ ok: true });
      case "rename":
        await renameEntry(pathStr.parse(body.from), pathStr.parse(body.to), Boolean(body.isFolder));
        return NextResponse.json({ ok: true });
      default:
        return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Operação falhou no S3." }, { status: 500 });
  }
}
