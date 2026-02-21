import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coaches } from "@/lib/db/schema";
import { ilike } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const results = await db
    .select({ id: coaches.id, name: coaches.name })
    .from(coaches)
    .where(ilike(coaches.name, `%${q}%`))
    .limit(10);

  return NextResponse.json(results);
}
