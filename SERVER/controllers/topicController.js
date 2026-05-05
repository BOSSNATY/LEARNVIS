const pool = require("../config/db");

const { buildTopicContent } = require("../services/contentService");

exports.createTopic = async (req, res) => {
  let { subjectId, subject_id, title, description, difficulty } = req.body;

  const userId = req.user.userId;

  try {
    const finalSubjectId = subjectId || subject_id;

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

    // insert (ALL topics are now unified)
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

exports.getTopicsBySubject = async (req, res) => {
  const { subjectId } = req.params;

  try {
    const [topics] = await pool.execute(
      `SELECT 
        id,
        subject_id,
        title,
        description,
        difficulty,
        is_custom,
        created_by
       FROM topics
       WHERE subject_id = ?
       AND (is_custom = FALSE OR created_by = ?)`,
      [subjectId, req.user?.userId || 0],
    );

    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTopic = async (req, res) => {
  const { id } = req.params;

  try {
    const [topic] = await pool.execute(`SELECT * FROM topics WHERE id = ?`, [
      id,
    ]);

    res.json(topic[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.startTopic = async (req, res) => {
  const { id: topicId } = req.params;
  const userId = req.user.userId;

  try {
    // 1. CHECK ACTIVE SESSION
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
      // 2. CREATE NEW SESSION
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

    // 3. GENERATE CONTENT (unchanged)
    const content = await buildTopicContent(topicId, userId);

    // 4. RETURN BOTH SESSION + CONTENT
    res.json({
      message: "Topic ready",
      session,
      content,
    });
  } catch (err) {
    console.error("startTopic error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTopic = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    // only allow deleting OWN custom topics
    const [topic] = await pool.execute(`SELECT * FROM topics WHERE id = ?`, [
      id,
    ]);

    if (!topic.length) {
      return res.status(404).json({ error: "Topic not found" });
    }

    if (!topic[0].is_custom || topic[0].created_by !== userId) {
      return res.status(403).json({
        error: "You can only delete your own custom topics",
      });
    }

    await pool.execute(`DELETE FROM topics WHERE id = ?`, [id]);

    res.json({ message: "Topic deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
