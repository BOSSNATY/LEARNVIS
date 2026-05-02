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

  for (const item of plan) {
    if (typeof item.day !== "number") return false;
    if (typeof item.parentTopic !== "string") return false;
    if (!Array.isArray(item.subtopics) && item.subtopics !== undefined)
      return false;
  }

  return true;
}

exports.generatePlan = async (topics, totalDays, dailyTime) => {
  const topicList = topics.map((t) => t.title).join(", ");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
    You are an expert AI learning strategist.

    Topics:
    ${topicList}

    Constraints:
    - Available days: ${totalDays}
    - Daily study time: ${dailyTime} minutes

    Rules:
    - Respect ALL constraints if provided
    - If constraints are strict (exam/duration), optimize within them
    - If no constraints, design best learning flow for mastery
    - Break topics into subtopics when needed
    - Include learning, practice, revision, and quiz phases
    - Avoid rigid patterns
    - Focus on understanding, not speed

    Return ONLY valid JSON:

    [
    {
        "day": number,
        "type": "learn" | "revision" | "quiz",
        "parentTopic": "string",
        "subtopics": ["string"]
    }
    ]
                `,
            },
          ],
        },
      ],
    });

    // 1. CLEAN OUTPUT
    const cleaned = cleanAIResponse(response.text);

    // 2. PARSE JSON
    const plan = JSON.parse(cleaned);

    // 3. VALIDATE
    if (!validatePlan(plan)) {
      throw new Error("Invalid AI plan structure");
    }

    return plan;

    // return JSON.parse(response.text.trim());
  } catch (err) {
    console.error("AI generation failed:", err.message);
    throw err;
  }
};
