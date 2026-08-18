import OpenAI from "openai";

const apiKey = process.env.FIREWORKS_API_KEY;
if (!apiKey) {
  console.warn("FIREWORKS_API_KEY is not defined in environment variables.");
}

const client = new OpenAI({
  apiKey: apiKey || "dummy_key",
  baseURL: "https://api.fireworks.ai/inference/v1",
});

const MODEL = process.env.FIREWORKS_MODEL || "accounts/fireworks/models/kimi-k2p6";

function extractJson(text: string): string {
  // Try to match standard ```json ... ``` block
  const match = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (match) {
    return match[1].trim();
  }

  // Fallback: search for first '{' and matching last '}'
  const startIdx = text.indexOf("{");
  if (startIdx !== -1) {
    const endIdx = text.lastIndexOf("}");
    if (endIdx > startIdx) {
      const candidate = text.substring(startIdx, endIdx + 1);
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        // Continue to default fallback
      }
    }
  }

  return text.trim();
}

export async function askForJson<T = any>(
  system: string,
  userMessages: { role: "user" | "assistant" | "system"; content: string }[],
  maxTokens: number = 700
): Promise<T> {
  const jsonSystem =
    system +
    "\n\nYou MUST wrap your final JSON output in ```json and ``` markdown fences. " +
    "Before the JSON, you may think step-by-step. " +
    "But your final answer must be a single valid JSON object inside a ```json block.";

  const run = async (): Promise<T> => {
    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        { role: "system", content: jsonSystem },
        ...userMessages,
      ] as any,
      response_format: { type: "json_object" },
    });

    const text = response.choices[0].message.content || "";
    try {
      const extracted = extractJson(text);
      return JSON.parse(extracted) as T;
    } catch (e) {
      console.error("Failed to parse JSON. Raw text was:", JSON.stringify(text));
      throw e;
    }
  };

  try {
    return await run();
  } catch (err) {
    console.warn("JSON parse/API error, retrying once. Error:", err);
    return await run();
  }
}
