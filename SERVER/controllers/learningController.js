const pool = require("../config/db");
const { buildTopicContent } = require("../services/contentService");

// POST /api/learning/start
exports.startLearning = async (req, res) => {
  const userId = req.user.userId;
  const { topicId, subjectId, hoursPerDay, mode, daysLeft } = req.body;

  if (!topicId || !subjectId) {
    return res.status(400).json({ error: "topicId and subjectId are required" });
  }

  try {
    // 1. Generate or fetch AI content for the topic
    const content = await buildTopicContent(topicId, userId);

    // 2. Estimate study days based on content size
    const contentLength = content.length;
    const charsPerMinute = 800; // avg reading/study rate
    const totalMinutes = contentLength / charsPerMinute;
    const hoursPerDaySafe = Math.max(hoursPerDay || 1, 0.5);
    let totalDays = Math.ceil(totalMinutes / 60 / hoursPerDaySafe);
    totalDays = Math.max(totalDays, 1);

    if (mode === "exam" && daysLeft) {
      totalDays = Math.min(totalDays, daysLeft);
    }

    // 3. Init or update learning state
    await pool.execute(
      `INSERT INTO learning_state (user_id, subject_id, topic_id, status, progress_percent)
       VALUES (?, ?, ?, 'learning', 0)
       ON DUPLICATE KEY UPDATE status = 'learning', updated_at = NOW()`,
      [userId, subjectId, topicId]
    );

    res.json({
      message: "Learning started",
      topicId,
      totalDays,
      contentPreview: content.substring(0, 300) + "...",
      note: "Plan adapts to content size",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/learning/content/:topicId
exports.getTopicContent = async (req, res) => {
  const { topicId } = req.params;
  const userId = req.user.userId;

  try {
    // Try to get cached content first
    const [[cached]] = await pool.execute(
      "SELECT text_content, updated_at FROM content WHERE topic_id = ? ORDER BY id DESC LIMIT 1",
      [topicId]
    );

    if (cached) {
      return res.json({ topicId, content: cached.text_content, cached: true });
    }

    // Generate fresh if not cached
    const content = await buildTopicContent(topicId, userId);
    res.json({ topicId, content, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
