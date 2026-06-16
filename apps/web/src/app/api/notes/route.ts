import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { getPrisma, isDbConfigured } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NOTE_ID = "main";
const putSchema = z.object({
  content: z.string().max(20_000),
  title: z.string().max(120).optional(),
});

export async function GET() {
  if (!isDbConfigured()) return NextResponse.json({ note: null, dbDisabled: true });
  try {
    const prisma = getPrisma();
    const note = await prisma.note.findUnique({ where: { id: NOTE_ID } });
    return NextResponse.json({ note });
  } catch {
    return NextResponse.json({ note: null, error: "db_error" });
  }
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: "DB offline" }, { status: 503 });

  let data: z.infer<typeof putSchema>;
  try {
    data = putSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    const note = await prisma.note.upsert({
      where: { id: NOTE_ID },
      create: { id: NOTE_ID, content: data.content, title: data.title ?? "notes" },
      update: { content: data.content, ...(data.title ? { title: data.title } : {}) },
    });
    return NextResponse.json({ ok: true, note });
  } catch {
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
}
