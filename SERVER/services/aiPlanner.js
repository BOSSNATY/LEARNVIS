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

exports.generatePlan = async (topics, totalDays, dailyTime) => {
  try {
    const topicList = topics.map((t) => t.title).join(", ");

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
    You are a study planner AI.

    Topics:
    ${topicList}

    Days available: ${totalDays}
    Daily study time: ${dailyTime} minutes

    Distribute the topics across the days.

    Return STRICT JSON:
    [
    {
        "day": 0,
        "topics": ["topic name"]
    }
    ]
              `,
            },
          ],
        },
      ],
    });

    const text = response.text.trim();

    // try parsing
    return JSON.parse(text);
  } catch (err) {
    console.error("AI parse failed:", err.message);
    throw err;
  }
};
