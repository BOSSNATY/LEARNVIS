const pool = require("../config/db");
const { generateTopicContent } = require("./aiContentService");

/**
 * Build full content for a topic
 */
async function buildTopicContent(topicId, userId = null) {
  // 1. Get topic
  const [topicRows] = await pool.execute(`SELECT * FROM topics WHERE id = ?`, [
    topicId,
  ]);

  const topic = topicRows[0];
  if (!topic) throw new Error("Topic not found");

  // 2. Get user materials (optional)
  const [materials] = await pool.execute(
    `SELECT * FROM user_materials WHERE topic_id = ?`,
    [topicId],
  );

  // 3. Generate AI content
  const aiContent = await generateTopicContent(topic, materials);

  // 4. Save to DB
  await pool.execute(
    `INSERT INTO content (topic_id, type, text_content, source)
     VALUES (?, 'text', ?, 'ai')`,
    [topicId, aiContent],
  );

  return aiContent;
}

module.exports = {
  buildTopicContent,
};
