import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

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

    if (session.done) {
      return NextResponse.json({ done: true });
    }

    // Get the active (unanswered) turn in the transcript
    const activeTurn = session.transcript.find((t) => t.answer === null);
    if (!activeTurn) {
      // If there's no unanswered question, but we aren't done, we might have completed all stages
      return NextResponse.json({ done: true });
    }

    const progress = {
      stageIndex: session.stageIndex,
      totalStages: session.domain.stages.length,
      questionsAsked: session.totalQuestions,
      difficulty: session.difficulty,
    };

    // Find the last completed turn's score as the lastScore
    const completedTurns = session.transcript.filter((t) => t.answer !== null);
    const lastTurn = completedTurns[completedTurns.length - 1];
    const lastScore = lastTurn?.evaluation?.scores || null;
    const lastHint = lastTurn?.evaluation?.hint || null;

    return NextResponse.json({
      sessionId: session.id,
      persona: activeTurn.persona,
      question: activeTurn.question,
      stage: activeTurn.stage,
      progress,
      done: false,
      hint: lastHint,
      lastScore,
      spokenText: activeTurn.question, // just repeat the question on refresh
    });
  } catch (err: any) {
    console.error("Error in GET /api/interview/session/[sessionId]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
