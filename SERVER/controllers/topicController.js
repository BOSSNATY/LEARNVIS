const pool = require("../config/db");
const { buildTopicContent } = require("../services/contentService");

/* =========================
   CREATE TOPIC
========================= */
exports.createTopic = async (req, res) => {
  let { subjectId, subject_id, title, description, difficulty } = req.body;
  const userId = req.user.userId;

  try {
    const finalSubjectId = Number(subjectId || subject_id);

    if (!finalSubjectId || !title) {
      return res.status(400).json({
        error: "subjectId and title are required",
      });
    }

    title = title.trim().toLowerCase();

    // check duplicate
    const [existing] = await pool.execute(
      `SELECT id FROM topics WHERE subject_id = ? AND title = ?`,
      [finalSubjectId, title],
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: "Topic already exists",
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO topics 
       (subject_id, title, description, difficulty, is_custom, created_by)
       VALUES (?, ?, ?, ?, TRUE, ?)`,
      [
        finalSubjectId,
        title,
        description || "No description",
        difficulty || "beginner",
        userId,
      ],
    );

    res.status(201).json({
      message: "Topic created",
      topicId: result.insertId,
    });
  } catch (error) {
    console.error("Create topic error:", error);
    res.status(500).json({ error: error.message });
  }
};

/* =========================
   GET TOPICS BY SUBJECT
========================= */
exports.getTopicsBySubject = async (req, res) => {
  const subjectId = Number(req.params.subjectId);
  const userId = req.user?.userId || null;

  try {
    const [topics] = await pool.execute(
      `SELECT id, subject_id, title, description, difficulty, is_custom, created_by
       FROM topics
       WHERE subject_id = ?
       AND (is_custom = FALSE OR created_by = ?)`,
      [subjectId, userId],
    );

    res.json(topics);
  } catch (error) {
    console.error("Get topics error:", error);
    res.status(500).json({ error: error.message });
  }
};

/* =========================
   GET SINGLE TOPIC
========================= */
exports.getTopic = async (req, res) => {
  const { id } = req.params;

  try {
    const [topic] = await pool.execute(`SELECT * FROM topics WHERE id = ?`, [
      id,
    ]);

    if (!topic.length) {
      return res.status(404).json({ error: "Topic not found" });
    }

    res.json(topic[0]);
  } catch (error) {
    console.error("Get topic error:", error);
    res.status(500).json({ error: error.message });
  }
};

/* =========================
   START TOPIC (SESSION ONLY)
   🔥 CLEANED VERSION
========================= */
exports.startTopic = async (req, res) => {
  const topicId = Number(req.params.id);
  const userId = req.user.userId;

  try {
    if (!topicId) {
      return res.status(400).json({ error: "Invalid topicId" });
    }

    // 1. check active session
    const [existing] = await pool.execute(
      `SELECT * FROM study_sessions
       WHERE user_id = ? AND topic_id = ? AND status = 'active'
       ORDER BY start_time DESC
       LIMIT 1`,
      [userId, topicId],
    );

    let session;

    if (existing.length > 0) {
      session = existing[0];
    } else {
      // 2. create new session
      const [result] = await pool.execute(
        `INSERT INTO study_sessions (user_id, topic_id, start_time, progress, status)
         VALUES (?, ?, NOW(), 0, 'active')`,
        [userId, topicId],
      );

      const [newSession] = await pool.execute(
        `SELECT * FROM study_sessions WHERE id = ?`,
        [result.insertId],
      );

      session = newSession[0];
    }

    // 3. OPTIONAL: generate content (keep here for now)
    const content = await buildTopicContent(topicId, userId);

    return res.json({
      message: "Topic session started",
      session,
      content,
    });
  } catch (err) {
    console.error("startTopic error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   DELETE TOPIC
========================= */
exports.deleteTopic = async (req, res) => {
  const topicId = req.params.id;
  const userId = req.user.userId;

  try {
    const [topic] = await pool.execute(`SELECT * FROM topics WHERE id = ?`, [
      topicId,
    ]);

    if (!topic.length) {
      return res.status(404).json({ error: "Topic not found" });
    }

    if (!topic[0].is_custom || topic[0].created_by !== userId) {
      return res.status(403).json({
        error: "You can only delete your own custom topics",
      });
    }

    await pool.execute(`DELETE FROM topics WHERE id = ?`, [topicId]);

    res.json({ message: "Topic deleted" });
  } catch (err) {
    console.error("Delete topic error:", err);
    res.status(500).json({ error: err.message });
  }
};
