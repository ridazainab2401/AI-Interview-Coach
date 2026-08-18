import { NextRequest, NextResponse } from "next/server";
import { startInterview } from "@/lib/agent";

export async function POST(req: NextRequest) {
  try {
    const { domainId, candidateName } = await req.json();

    if (!domainId) {
      return NextResponse.json({ error: "domainId is required" }, { status: 400 });
    }

    const data = await startInterview(domainId, candidateName || "Candidate");
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error in /api/interview/start:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
