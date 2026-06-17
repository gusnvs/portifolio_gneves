import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma, isDbConfigured } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const GAMES = ["snake", "memory", "simon"] as const;

const postSchema = z.object({
  game: z.enum(GAMES),
  name: z.string().min(1).max(20),
  points: z.number().int().min(0).max(100_000),
});

export async function GET(req: Request) {
  const game = new URL(req.url).searchParams.get("game") ?? "";
  if (!GAMES.includes(game as (typeof GAMES)[number])) {
    return NextResponse.json({ error: "Jogo inválido." }, { status: 400 });
  }
  if (!isDbConfigured()) return NextResponse.json({ scores: [], dbDisabled: true });
  try {
    const prisma = getPrisma();
    const scores = await prisma.score.findMany({
      where: { game },
      orderBy: [{ points: "desc" }, { createdAt: "asc" }],
      take: 10,
      select: { name: true, points: true, createdAt: true },
    });
    return NextResponse.json({ scores });
  } catch {
    return NextResponse.json({ scores: [], error: "db_error" });
  }
}

export async function POST(req: Request) {
  if (!isDbConfigured()) return NextResponse.json({ error: "Ranking offline." }, { status: 503 });
  if (!rateLimit(`score:${clientIp(req)}`, 20, 60_000).ok) {
    return NextResponse.json({ error: "Calma aí!" }, { status: 429 });
  }
  let data: z.infer<typeof postSchema>;
  try {
    data = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const name = data.name.trim().slice(0, 20) || "anon";
  try {
    const prisma = getPrisma();
    await prisma.score.create({ data: { game: data.game, name, points: data.points } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Falha ao salvar." }, { status: 500 });
  }
}
