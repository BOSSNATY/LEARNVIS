const pool = require("../config/db");

async function handleMistakes(userId, analysis) {
  for (const item of analysis) {
    if (item.isCorrect) continue;

    await pool.execute(
      `INSERT INTO mistake_profiles (user_id, concept_tag, frequency)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE frequency = frequency + 1`,
      [userId, item.concept || "general"],
    );
  }
}

async function updateLearningState(userId, quizId, score) {
  const [quizRows] = await pool.execute(
    `SELECT topic_id FROM quizzes WHERE id = ?`,
    [quizId],
  );

  const topicId = quizRows[0]?.topic_id;
  if (!topicId) return;

  let status = "practicing";
  if (score >= 96) status = "mastered";

  await pool.execute(
    `UPDATE learning_state
     SET mastery_score = ?, status = ?
     WHERE user_id = ? AND topic_id = ?`,
    [score, status, userId, topicId],
  );
}

module.exports = {
  handleMistakes,
  updateLearningState,
};
