const pool = require("../config/db");
const { generateTopicContent } = require("./aiContentService");

/**
 * Build full content for a topic
 */
async function buildTopicContent(topicId, userId,taskId, subtopics) {
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
  const aiContent = await generateTopicContent(topic, materials, subtopics);


  if(!aiContent || aiContent.includes("Basic explanation")){
    throw new Error("Failed to generate AI content");
  }

  // 4. Save to DB
  await pool.execute(
    `INSERT INTO content (topic_id,task_id, type, text_content, source)
     VALUES (?,?, 'text', ?, 'ai')`,
    [topicId,taskId || null, aiContent],
  );

  return aiContent;
}

module.exports = {
  buildTopicContent,
};
