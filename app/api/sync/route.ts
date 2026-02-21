import { NextRequest, NextResponse } from "next/server";
import { runSync } from "@/lib/sync";

export const maxDuration = 300; // seconds — requires Vercel Pro for >60s

export async function POST(req: NextRequest) {
  // Verify authorization
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.error("CRON_SECRET env variable is not set");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Starting sync...");
    const result = await runSync();
    console.log("Sync complete:", result);

    return NextResponse.json({
      ok: true,
      matchesAdded: result.matchesAdded,
      teamsAdded: result.teamsAdded,
      durationMs: result.durationMs,
    });
  } catch (error) {
    console.error("Sync failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Vercel Cron calls GET, so we support both methods
export async function GET(req: NextRequest) {
  return POST(req);
}
