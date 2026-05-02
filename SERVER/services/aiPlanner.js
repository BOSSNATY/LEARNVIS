const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function cleanAIResponse(text) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function validatePlan(plan) {
  if (!Array.isArray(plan)) return false;

  for (const day of plan) {
    if (typeof day.day !== "number") return false;
    if (!Array.isArray(day.topics)) return false;
  }

  return true;
}

exports.generatePlan = async (topics, days, dailyTime) => {
  const prompt = `
    You are a study planner AI.

    Return ONLY valid JSON.
    Do NOT include:
    - explanations
    - text
    - markdown
    - backticks

    STRICT FORMAT:
    [
    { "day": 0, "topics": ["topic name"] },
    { "day": 1, "topics": ["topic name"] }
    ]

    Topics:
    ${topics.map((t) => `- ${t.title} (${t.difficulty})`).join("\n")}

    Days: ${days}
    Daily time: ${dailyTime} minutes
    `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const cleaned = cleanAIResponse(response.text);

  const parsed = JSON.parse(cleaned);

  if (!validatePlan(parsed)) {
    throw new Error("Invalid AI structure");
  }

  return parsed;
};
