import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getPrisma, isDbConfigured } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: "DB offline" }, { status: 503 });
  const { id } = await ctx.params;
  try {
    const prisma = getPrisma();
    await prisma.guestbookMessage.update({ where: { id }, data: { hidden: true } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
