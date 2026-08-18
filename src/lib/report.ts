import { InterviewSession, ScoreSet } from "./session";

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sum = nums.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / nums.length) * 10) / 10;
}

function buildRecommendation(session: InterviewSession, overall: number): string {
  if (session.weakAreas.length === 0) {
    return "Strong, consistent performance across all stages. Keep practicing under time pressure to stay sharp.";
  }
  const areas = session.weakAreas.slice(0, 3).join(", ");
  if (overall >= 7) {
    return `Solid overall performance. Sharpen your answers on: ${areas}.`;
  }
  return `Focus your next practice sessions on: ${areas}. Revisit fundamentals and practice explaining them out loud.`;
}

export function buildReport(session: InterviewSession): any {
  const communicationScores = session.scores.map((s) => s.communication);
  const technicalScores = session.scores.map((s) => s.technical);
  const confidenceScores = session.scores.map((s) => s.confidence);
  const problemSolvingScores = session.scores.map((s) => s.problemSolving);

  const comm = average(communicationScores);
  const tech = average(technicalScores);
  const conf = average(confidenceScores);
  const prob = average(problemSolvingScores);
  const overall = average([comm, tech, conf, prob]);

  const qa = session.transcript
    .filter((t) => t.answer !== null && t.answer !== "")
    .map((t) => {
      const evaluation = t.evaluation || {};
      const scores = evaluation.scores || {
        communication: 0,
        technical: 0,
        confidence: 0,
        problemSolving: 0,
      };
      const feedback = evaluation.spokenFeedback || "No response provided";

      return {
        stage: t.stage,
        persona: t.persona,
        question: t.question,
        difficulty: t.difficulty,
        answer: t.answer,
        scores,
        feedback,
      };
    });

  return {
    candidate: session.candidateName,
    role: session.domain?.label || "General Role",
    questionsAsked: session.totalQuestions,
    scoreboard: {
      communication: comm,
      technical: tech,
      confidence: conf,
      problemSolving: prob,
      overall,
    },
    difficultyPath: session.difficultyPath,
    strongAreas: session.strongAreas,
    weakAreas: session.weakAreas,
    recommendation: buildRecommendation(session, overall),
    transcript: qa,
  };
}
