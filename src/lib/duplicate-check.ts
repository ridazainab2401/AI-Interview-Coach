const TEXT_DUPLICATE_THRESHOLD = 0.42;

// Stopwords list matching the Python version
const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "to", "of", "in", "on",
  "for", "and", "or", "you", "your", "me", "i", "what", "how", "why", "can", "could",
  "would", "tell", "about", "explain", "describe", "do", "does", "did", "that", "this",
  "with", "it", "s", "we", "us", "our", "when", "where", "which",
]);

function getTokens(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOPWORDS.has(w));
  return new Set(words);
}

export function jaccardSimilarity(a: string, b: string): number {
  const ta = getTokens(a);
  const tb = getTokens(b);
  if (ta.size === 0 || tb.size === 0) return 0.0;

  const intersection = new Set([...ta].filter((w) => tb.has(w)));
  const union = new Set([...ta, ...tb]);

  return intersection.size / union.size;
}

export function isDuplicate(
  candidateQuestion: string,
  askedQuestions: { question: string }[]
): boolean {
  for (const prior of askedQuestions) {
    if (jaccardSimilarity(candidateQuestion, prior.question) >= TEXT_DUPLICATE_THRESHOLD) {
      return true;
    }
  }
  return false;
}
