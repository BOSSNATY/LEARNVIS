const pool = require("../config/db");

exports.createTopic = async (req, res) => {
  const { subjectId, title, description, difficulty } = req.body;

  try {
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
