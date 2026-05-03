const pool = require("../config/db");

const { buildTopicContent } = require("../services/contentService");

exports.createTopic = async (req, res) => {
  let { subjectId, title, description, difficulty } = req.body;

  try {
    // Normalize input (VERY IMPORTANT)
    title = title.trim().toLowerCase();

    // Check duplicates first
    const [existing] = await pool.execute(
      "SELECT id FROM topics WHERE subject_id = ? AND title = ?",
      [subjectId, title],
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: "Topic already exists under this subject",
      });
    }

    // Insert safely
    const [result] = await pool.execute(
      `INSERT INTO topics (subject_id, title, description, difficulty)
       VALUES (?, ?, ?, ?)`,
      [subjectId, title, description, difficulty],
    );

    res.status(201).json({
      message: "Topic created",
      topicId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCustomTopic = async (req, res) => {
  let { subjectId, title, description, difficulty } = req.body;
  const userId = req.user.userId;

  try {
    title = title.trim().toLowerCase();

    const [existing] = await pool.execute(
      `SELECT id FROM topics WHERE subject_id = ? AND title = ?`,
      [subjectId, title],
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
      [subjectId, title, description, difficulty, userId],
    );

    res.status(201).json({
      message: "Custom topic created",
      topicId: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTopicsBySubject = async (req, res) => {
  const { subjectId } = req.params;

  try {
    const [topics] = await pool.execute(
      `SELECT *
  FROM topics
  WHERE subject_id = ?
  AND (is_custom = FALSE OR created_by = ?)`,
      [subjectId],
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
  const { id } = req.params;
  const topicId = id;
  const userId = req.user.userId;
  console.log(userId);
  console.log("START ROUTE HIT");
  console.log("PARAMS:", req.params);

  try {
    const content = await buildTopicContent(topicId, userId);

    res.json({
      message: "Topic content ready",
      content,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
