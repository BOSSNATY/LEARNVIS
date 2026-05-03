const pool = require("../config/db");

/**
 * Update learning state after a quiz score
 */
async function updateLearningState(userId, quizId, score) {
  const [[quiz]] = await pool.execute(
    "SELECT topic_id FROM quizzes WHERE id = ?",
    [quizId]
  );
  if (!quiz) return;

  const status = score >= 96 ? "mastered" : "practicing";

  await pool.execute(
    `UPDATE learning_state
     SET mastery_score = ?, status = ?, updated_at = NOW()
     WHERE user_id = ? AND topic_id = ?`,
    [score, status, userId, quiz.topic_id]
  );
}

module.exports = { updateLearningState };
