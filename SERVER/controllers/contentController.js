const path = require("path");
const pool = require("../config/db");
const { buildTopicContent } = require("../services/contentService");
const fs = require("fs");

// POST /api/content/generate
exports.generateContent = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { topicId } = req.body;

  if (!topicId) return res.status(400).json({ error: "topicId is required" });

  try {
    const content = await buildTopicContent(topicId, userId);
    res.status(201).json({ topicId, content, source: "ai" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/content/upload
exports.uploadContent = async (req, res) => {
  const userId = req.user?.id || req.user?.userId;
  const { topicId, type } = req.body;

  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = req.file.path;

    await pool.execute(
      `INSERT INTO user_materials (user_id, topic_id, file_url, type)
      VALUES (?, ?, ?,?)`,
      [userId, topicId, filePath, type || "note"],
    );
    res.json({ message: "Material uploaded successfully", file_url: filePath });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/content/:topicId
exports.getContent = async (req, res) => {
  const { topicId } = req.params;
  const userId = req.user?.id || req.user?.userId;
  const sessionId = req.query.sessionId;
  const taskId = req.query.taskId;

  try {
    let isValidAccess = false;

    // Check if there is an active session
    if (sessionId) {
      const [[validSession]] = await pool.execute(
        `SELECT id FROM study_sessions 
         WHERE id = ? AND user_id = ? AND topic_id = ? AND status = 'active'`,
        [sessionId, userId, topicId],
      );
      if (validSession) isValidAccess = true;
    }

    // If no active session, check if the task is already completed (review mode)
    if (!isValidAccess && taskId) {
      const [[completedTask]] = await pool.execute(
        `SELECT id FROM study_tasks st
         JOIN study_plans sp ON st.plan_id = sp.id
         WHERE st.id = ? AND sp.user_id = ? AND st.status = 'completed'`,
        [taskId, userId],
      );
      if (completedTask) isValidAccess = true;
    }

    if (!isValidAccess) {
      return res.status(403).json({
        error: "Access Denied: No active session found for this topic.",
      });
    }

    // Check if the user has already attempted the quiz for this topic
    const [[hasAttemptRow]] = await pool.execute(
      `SELECT qa.id FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       WHERE qa.user_id = ? AND q.topic_id = ? LIMIT 1`,
      [userId, topicId],
    );
    const hasAttempt = !!hasAttemptRow;

    const [[cached]] = await pool.execute(
      "SELECT * FROM content WHERE topic_id = ? AND task_id = ? ORDER BY id DESC LIMIT 1",
      [topicId, taskId || 0],
    );

    const [materials] = await pool.execute(
      userId
        ? "SELECT * FROM user_materials WHERE topic_id = ? AND user_id = ? ORDER BY id DESC"
        : "SELECT * FROM user_materials WHERE topic_id = ? ORDER BY id DESC",
      userId ? [topicId, userId] : [topicId],
    );
    const [[learningState]] = await pool.execute(
      "SELECT status, progress_percent, mastery_score FROM learning_state WHERE user_id = ? AND topic_id = ?",
      [userId, topicId],
    );

    if (cached)
      return res.json({
        topicId,
        content: {
          text_content: cached.text_content || cached.content,
          source: "ai",
        },
        materials,
        cached: true,
        learningState,
        hasAttempt,
      });

    let taskSubtopics = null;
    if (taskId) {
      const [[task]] = await pool.execute(
        "SELECT subtopics FROM study_tasks WHERE id = ?",
        [taskId],
      );
      if (task && task.subtopics) taskSubtopics = task.subtopics;
    }

    const content = await buildTopicContent(
      topicId,
      userId,
      taskId,
      taskSubtopics,
    );

    res.json({
      topicId,
      content: { text_content: content, source: "ai" },
      learningState,
      materials,
      cached: false,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
