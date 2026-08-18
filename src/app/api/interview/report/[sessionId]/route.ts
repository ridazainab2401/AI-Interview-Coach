import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { buildReport } from "@/lib/report";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });
    }

    const report = buildReport(session);
    return NextResponse.json(report);
  } catch (err: any) {
    console.error("Error in /api/interview/report GET:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
