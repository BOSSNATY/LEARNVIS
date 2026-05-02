const pool = require("../config/db");

async function updateMistakeProfile(userId, topicId, conceptTag) {
  if (!conceptTag) return;

  await pool.execute(
    `
    INSERT INTO mistake_profiles (user_id, topic_id, concept_tag, frequency)
    VALUES (?, ?, ?, 1)
    ON DUPLICATE KEY UPDATE frequency = frequency + 1
    `,
    [userId, topicId, conceptTag],
  );
}

module.exports = {
  updateMistakeProfile,
};
