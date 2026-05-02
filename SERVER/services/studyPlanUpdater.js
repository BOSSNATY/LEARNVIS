const pool = require("../config/db");

async function updateStudyPlanFromMistakes(planId, userId) {
  const [weakTopics] = await pool.execute(
    `
    SELECT topic_id, SUM(frequency) AS score
    FROM mistake_profiles
    WHERE user_id = ?
    GROUP BY topic_id
    ORDER BY score DESC
    `,
    [userId],
  );

  if (!weakTopics.length) return;

  for (const t of weakTopics) {
    await pool.execute(
      `
      UPDATE study_tasks
      SET session_type = 'revision'
      WHERE plan_id = ? AND topic_id = ?
      `,
      [planId, t.topic_id],
    );
  }
}

module.exports = {
  updateStudyPlanFromMistakes,
};
