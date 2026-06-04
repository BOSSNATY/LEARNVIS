const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// 🔁 SAFE WRAPPER with exponential backoff
async function safeGenerate(fn, retries = 3, delay = 3000) {
  try {
    return await fn();
  } catch (err) {
    console.error("AI Error:", err.message);

    if (retries > 0) {
      console.log(`Retrying AI in ${delay / 1000}s... (${retries} left)`);
      await new Promise((r) => setTimeout(r, delay));
      return safeGenerate(fn, retries - 1, delay * 2); // Double the wait each time
    }

    throw err;
  }
}

// 🔹 Generate quiz questions
exports.generateQuizAI = async ({ topic, difficulty, count }) => {
  return safeGenerate(async () => {
    const prompt = `
            You are an expert teacher.

            Generate ${count} questions about "${topic}".
            Difficulty: ${difficulty}
            
            First, analyze the cognitive load and calculate an appropriate time limit (in seconds) for the student to complete this entire quiz.

            Rules:
            - Mix conceptual, application, and reasoning questions
            - Each question must have 4 options
            - Only ONE correct answer
            - Return STRICT JSON (no explanation)

            Format:
            {
              "timeLimitSeconds": 300,
              "questions": [
                {
                    "question": "...",
                    "cognitive_category": "conceptual | calculation | application",
                    "options": [
                    {"text": "...", "is_correct": true},
                    {"text": "...", "is_correct": false}
                    ]
                }
              ]
            }
            `;

    const response = await ai.models.generateContent({
      model: "models/gemini-3.1-flash-lite",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let text = response.text.trim();
    text = text.replace(/```json|```/g, "");

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        parsed.timeLimitSeconds = count * 60; // fallback
        return parsed;
      }

      // Attach timeLimit to the array itself so we don't break existing code!
      const questionsArray = parsed.questions || [];
      questionsArray.timeLimitSeconds = parsed.timeLimitSeconds || count * 60;
      return questionsArray;
    } catch (err) {
      console.error("Failed to parse AI Quiz JSON:", text);
      throw new Error("Invalid JSON format from AI");
    }
  });
};

// 🔹 Retry (rephrase wrong questions)
exports.rephraseQuestionsAI = async (questions) => {
  return safeGenerate(async () => {
    const prompt = `
        Rewrite the following questions in a NEW way.
        Keep meaning but change wording and structure.

        Return STRICT JSON:
        [
        {
            "question": "...",
            "options": [
            {"text": "...", "is_correct": true/false}
            ]
        }
        ]

        Questions:
        ${JSON.stringify(questions)}
        `;

    const response = await ai.models.generateContent({
      model: "models/gemini-3.1-flash-lite",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let text = response.text.trim();
    text = text.replace(/```json|```/g, "");

    return JSON.parse(text);
  });
};

exports.generateMicroLesson = async (concept, topic) => {
  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-3.1-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
    You are an expert tutor.

    Explain the concept "${concept}" from the topic "${topic}" in a simple but deep way.

    Requirements:
    - 5–10 lines
    - include intuition
    - include one simple example
    - avoid complex jargon
    - student-friendly tone
                `,
            },
          ],
        },
      ],
    });

    return response.text;
  } catch (err) {
    console.error("AI micro-lesson failed:", err.message);

    return `Basic explanation of ${concept}: Review the definition and try simple examples.`;
  }
};
