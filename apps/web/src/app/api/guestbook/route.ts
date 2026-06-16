import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma, isDbConfigured } from "@/lib/prisma";
import { rateLimit, clientIp, hashIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1).max(40),
  message: z.string().min(1).max(280),
  website: z.string().max(100).optional(), // honeypot — real users leave it empty
});

export async function GET() {
  if (!isDbConfigured()) return NextResponse.json({ messages: [], dbDisabled: true });
  try {
    const prisma = getPrisma();
    const messages = await prisma.guestbookMessage.findMany({
      where: { hidden: false },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, name: true, message: true, createdAt: true },
    });
    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ messages: [], error: "db_error" });
  }
}

export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Guestbook is offline." }, { status: 503 });
  }
  const ip = clientIp(req);
  if (!rateLimit(`gb:${ip}`, 4, 60_000).ok) {
    return NextResponse.json({ error: "Slow down a moment." }, { status: 429 });
  }

  let data: z.infer<typeof createSchema>;
  try {
    data = createSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  // honeypot tripped — pretend success, save nothing
  if (data.website) return NextResponse.json({ ok: true, message: null });

  const name = data.name.trim();
  const message = data.message.trim();
  if (!name || !message) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  try {
    const prisma = getPrisma();
    const message_ = await prisma.guestbookMessage.create({
      data: { name, message, ipHash: hashIp(ip) },
      select: { id: true, name: true, message: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, message: message_ });
  } catch {
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
}
