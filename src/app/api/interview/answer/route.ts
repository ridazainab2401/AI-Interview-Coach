import { NextRequest, NextResponse } from "next/server";
import { submitAnswer } from "@/lib/agent";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, answerText } = await req.json();

    if (!sessionId || answerText === undefined) {
      return NextResponse.json(
        { error: "sessionId and answerText are required" },
        { status: 400 }
      );
    }

    const data = await submitAnswer(sessionId, answerText);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error in /api/interview/answer:", err);
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}
