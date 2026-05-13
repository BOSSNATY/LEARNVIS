const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// 🔁 SAFE WRAPPER (put here)
async function safeGenerate(fn, retries = 3) {
  try {
    return await fn();
  } catch (err) {
    console.error("AI Error:", err.message);

    if (retries > 0) {
      console.log(`Retrying AI... (${retries})`);
      await new Promise((r) => setTimeout(r, 3000));
      return safeGenerate(fn, retries - 1);
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

            Rules:
            - Mix conceptual, application, and reasoning questions
            - Each question must have 4 options
            - Only ONE correct answer
            - Return STRICT JSON (no explanation)

            Format:
            [
            {
                "question": "...",
                "cognitive_category": "conceptual | calculation | application",
                "options": [
                {"text": "...", "is_correct": true},
                {"text": "...", "is_correct": false}
                ]
            }
            ]
            `;

    const response = await ai.models.generateContent({
      model: "models/gemini-3.1-flash-lite",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let text = response.text.trim();

    // Clean possible markdown
    text = text.replace(/```json|```/g, "");

    return JSON.parse(text);
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
