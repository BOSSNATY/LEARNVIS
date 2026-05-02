const pool = require("../config/db");

/**
 * Build mistake profile from quiz answers
 */
async function processMistakes(userId, analysis) {
  for (const item of analysis) {
    if (item.isCorrect) continue;

    const concept = item.concept || "general";

    // 1. Check if already exists
    const [existing] = await pool.execute(
      `SELECT id, frequency
       FROM mistake_profiles
       WHERE user_id = ? AND concept_tag = ?`,
      [userId, concept],
    );

    if (existing.length > 0) {
      // 2. Update frequency
      await pool.execute(
        `UPDATE mistake_profiles
         SET frequency = frequency + 1,
             last_seen = NOW()
         WHERE user_id = ? AND concept_tag = ?`,
        [userId, concept],
      );
    } else {
      // 3. Insert new mistake
      await pool.execute(
        `INSERT INTO mistake_profiles (user_id, concept_tag, frequency)
         VALUES (?, ?, 1)`,
        [userId, concept],
      );
    }
  }
}
