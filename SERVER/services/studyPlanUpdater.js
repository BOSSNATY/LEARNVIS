const pool = require("../config/db");

/**
 * After quiz mistakes, mark weak topics in the plan as 'revision' sessions.
 * Only affects future (pending) tasks, not completed ones.
 */
async function updateStudyPlanFromMistakes(planId, userId) {
  if (!planId) return;

  const [weakTopics] = await pool.execute(
    `SELECT topic_id, SUM(frequency) AS score
     FROM mistake_profiles
     WHERE user_id = ?
     GROUP BY topic_id
     ORDER BY score DESC`,
    [userId]
  );

  if (!weakTopics.length) return;

  for (const t of weakTopics) {
    await pool.execute(
      `UPDATE study_tasks
       SET session_type = 'revision'
       WHERE plan_id = ? AND topic_id = ? AND status = 'pending'`,
      [planId, t.topic_id]
    );
  }
}

module.exports = { updateStudyPlanFromMistakes };
