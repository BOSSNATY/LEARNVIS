const pool = require("../config/db");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function cleanResponse(text) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

async function generateMicroLesson(concept, topicTitle) {
  const response = await ai.models.generateContent({
    model: "models/gemini-3.1-flash-lite",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
You are a tutoring AI.

Create a micro-lesson for:

Concept: ${concept}
Topic: ${topicTitle}

Return ONLY JSON:
{
  "title": "string",
  "content": "simple explanation + example"
}
            `,
          },
        ],
      },
    ],
  });

  const cleaned = cleanResponse(response.text);
  return JSON.parse(cleaned);
}

// MAIN ENGINE
async function generateMicroLessons(userId, topicId, topicTitle = "") {
  const [profiles] = await pool.execute(
    `
    SELECT concept_tag, frequency
    FROM mistake_profiles
    WHERE user_id = ? AND topic_id = ?
    ORDER BY frequency DESC
    LIMIT 3
    `,
    [userId, topicId],
  );

  if (!profiles.length) return [];

  const generated = [];

  for (const p of profiles) {
    const concept = p.concept_tag;

    const [existing] = await pool.execute(
      `
      SELECT id FROM micro_lessons
      WHERE topic_id = ? AND concept_tag = ?
      `,
      [topicId, concept],
    );

    if (existing.length > 0) continue;

    const lesson = await generateMicroLesson(concept, topicTitle);

    await pool.execute(
      `
      INSERT INTO micro_lessons
      (user_id, topic_id, question_id, title, content, concept_tag)
      VALUES (?, ?, NULL, ?, ?, ?)
      `,
      [userId, topicId, lesson.title, lesson.content, concept],
    );

    generated.push(concept);
  }

  return generated;
}

module.exports = {
  generateMicroLessons,
};
