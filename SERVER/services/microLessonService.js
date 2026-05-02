const pool = require("../config/db");

const { generateMicroLesson } = require("./aiService");

async function generateMicroLessons(userId, topicId, topicTitle = "") {
  const [mistakes] = await pool.execute(
    `SELECT concept_tag, frequency
     FROM mistake_profiles
     WHERE user_id = ?
     ORDER BY frequency DESC`,
    [userId],
  );

  if (mistakes.length === 0) return;

  for (const m of mistakes) {
    const concept = m.concept_tag;

    const [existing] = await pool.execute(
      `SELECT id FROM micro_lessons
       WHERE topic_id = ? AND concept_tag = ?`,
      [topicId, concept],
    );

    if (existing.length > 0) continue;

    // 🧠 AI GENERATION (NEW)
    const aiContent = await generateMicroLesson(concept, topicTitle);

    await pool.execute(
      `INSERT INTO micro_lessons
       (topic_id, title, content, concept_tag)
       VALUES (?, ?, ?, ?)`,
      [topicId, `Fixing: ${concept}`, aiContent, concept],
    );
  }
}

module.exports = {
  generateMicroLessons,
};
