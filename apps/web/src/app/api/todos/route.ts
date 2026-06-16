import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { getPrisma, isDbConfigured } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const putSchema = z
  .array(z.object({ text: z.string().min(1).max(200), done: z.boolean() }))
  .max(200);

export async function GET() {
  if (!isDbConfigured()) return NextResponse.json({ todos: [], dbDisabled: true });
  try {
    const prisma = getPrisma();
    const todos = await prisma.todoItem.findMany({
      orderBy: { order: "asc" },
      select: { id: true, text: true, done: true, order: true },
    });
    return NextResponse.json({ todos });
  } catch {
    return NextResponse.json({ todos: [], error: "db_error" });
  }
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: "DB offline" }, { status: 503 });

  let items: z.infer<typeof putSchema>;
  try {
    items = putSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    await prisma.$transaction([
      prisma.todoItem.deleteMany({}),
      prisma.todoItem.createMany({
        data: items.map((t, i) => ({ text: t.text.trim(), done: t.done, order: i })),
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
}
