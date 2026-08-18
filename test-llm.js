const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

// Simple manual dotenv parsing
try {
  const envContent = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
  envContent.split("\n").forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const parts = trimmed.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
      process.env[key] = val;
    }
  });
} catch (e) {
  console.log("Could not read .env file:", e.message);
}

const apiKey = process.env.FIREWORKS_API_KEY;
const baseURL = "https://api.fireworks.ai/inference/v1";
const model = process.env.FIREWORKS_MODEL || "accounts/fireworks/models/kimi-k2p6";

const client = new OpenAI({
  apiKey: apiKey,
  baseURL: baseURL,
});

async function runTest(maxTokens) {
  const askedQuestions = [
    "To start, can you tell me what drew you to this frontend developer role?",
    "That makes sense. Since you mentioned React, how do you handle state management in a large-scale application, and when would you choose Redux over context?",
    "Great. Let's talk about web performance. What are some techniques you would use to optimize a React app that has a lot of heavy rendering?"
  ];
  const askedTopics = ["motivation", "state management", "performance"];
  const weakList = ["state management", "accessibility"];
  
  const system = `You are Ali, HR Interviewer, one interviewer in a panel interview for a Frontend Developer role.
Your part of the interview focuses on: background, motivation, culture fit.
Focus areas to draw from: JavaScript, React, CSS/Layout, Web Performance, Accessibility.

ADAPTIVE DIFFICULTY: the candidate's current level is 2/5 — easy — solid basics, no edge cases.
Calibrate the question's difficulty to match this level exactly. This is how you adapt to the candidate in real time, the same way a real interviewer would.

Ask ONE natural, conversational interview question (1-3 sentences), the way a real interviewer speaks out loud.
Never repeat, and never closely reword, any question already asked anywhere in this interview: ${JSON.stringify(askedQuestions)}.
Topics already covered, avoid asking about the same subject again unless explicitly told to circle back: ${JSON.stringify(askedTopics)}.
The candidate previously struggled with: ${weakList.join(", ")}. If it fits naturally, circle back to one of these once their level has recovered — but phrase it differently and from a different angle than before.`;

  const jsonSystem = system + "\n\nYou MUST return a single valid JSON object matching the requested schema. Do not wrap the output in markdown fences (like ```json) or add any explanation text outside the JSON object.";

  console.log(`\n--- Testing system prompt with max_tokens: ${maxTokens} ---`);
  try {
    const response = await client.chat.completions.create({
      model: model,
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        { role: "system", content: jsonSystem },
        { role: "user", content: 'Return JSON: {"question": string, "topic": string}' }
      ],
      response_format: { type: "json_object" },
    });

    console.log("Response status choice finish_reason:", response.choices[0].finish_reason);
    console.log("Response content:", JSON.stringify(response.choices[0].message.content));
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

async function runAll() {
  await runTest(1000);
  await runTest(2500);
}

runAll();
