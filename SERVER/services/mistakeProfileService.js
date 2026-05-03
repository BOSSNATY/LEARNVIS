const pool = require("../config/db");

/**
 * Upsert a mistake profile entry — increments frequency on repeat mistakes
 */
async function updateMistakeProfile(userId, topicId, conceptTag) {
  const tag = (conceptTag || "general").trim().toLowerCase();

  await pool.execute(
    `INSERT INTO mistake_profiles (user_id, topic_id, concept_tag, frequency)
     VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE frequency = frequency + 1, last_seen = NOW()`,
    [userId, topicId, tag],
  );
}

/**
 * Get top weak concepts for a user (optionally filtered by topic)
 */
async function getWeakConcepts(userId, topicId = null) {
  if (topicId) {
    const [rows] = await pool.execute(
      `SELECT concept_tag, frequency, last_seen
       FROM mistake_profiles
       WHERE user_id = ? AND topic_id = ?
       ORDER BY frequency DESC`,
      [userId, topicId],
    );
    return rows;
  }

  const [rows] = await pool.execute(
    `SELECT mp.concept_tag, SUM(mp.frequency) AS frequency,
            t.title AS topic_title, mp.topic_id
     FROM mistake_profiles mp
     LEFT JOIN topics t ON mp.topic_id = t.id
     WHERE mp.user_id = ?
     GROUP BY mp.concept_tag, mp.topic_id
     ORDER BY frequency DESC`,
    [userId],
  );
  return rows;
}

module.exports = { updateMistakeProfile, getWeakConcepts };
