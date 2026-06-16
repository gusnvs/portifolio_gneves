import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, verifyAdminPassword } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const schema = z.object({ password: z.string().min(1).max(300) });

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`login:${ip}`, 8, 60_000).ok) {
    return NextResponse.json({ error: "Too many attempts. Wait a minute." }, { status: 429 });
  }
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!(await verifyAdminPassword(body.password))) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  const session = await getSession();
  session.admin = true;
  await session.save();
  return NextResponse.json({ ok: true, admin: true });
}
