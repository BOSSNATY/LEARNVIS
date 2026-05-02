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
    You are a strict study planner.

    IMPORTANT RULES:
    - Only use topics exactly as given
    - Do NOT create new topics
    - Do NOT break topics into subtopics
    - Do NOT rename topics

    Available Topics:
    ${topics.map((t) => `- ${t.title}`).join("\n")}

    Return format:
    [
    {
        "day": 0,
        "topics": ["exact topic name here"]
    }
    ]
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
