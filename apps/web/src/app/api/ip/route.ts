import { NextResponse } from "next/server";
import { clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return NextResponse.json({ ip: clientIp(req) });
}
