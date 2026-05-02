const pool = require("../config/db");

exports.addMistake = async (req, res) => {
  const userId = req.user.id;
  const { topic_id, question_id, user_answer, correct_answer } = req.body;

  try {
    if (!topic_id || !question_id) {
      return res.status(400).json({
        error: "topic_id and question_id are required",
      });
    }

    // OPTIONAL: prevent duplicate mistake spam
    const [existing] = await pool.execute(
      `
      SELECT id FROM mistakes
      WHERE user_id = ?
        AND question_id = ?
        AND user_answer = ?
      `,
      [userId, question_id, user_answer],
    );

    if (existing.length > 0) {
      return res.json({
        message: "Mistake already recorded",
      });
    }

    await pool.execute(
      `
      INSERT INTO mistakes
      (user_id, topic_id, question_id, user_answer, correct_answer)
      VALUES (?, ?, ?, ?, ?)
      `,
      [userId, topic_id, question_id, user_answer, correct_answer],
    );

    res.json({ message: "Mistake recorded successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getWeakTopics = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await pool.execute(
      `
      SELECT 
        t.id AS topic_id,
        t.title,
        COUNT(m.id) AS mistake_count
      FROM mistakes m
      JOIN topics t ON m.topic_id = t.id
      WHERE m.user_id = ?
      GROUP BY t.id, t.title
      ORDER BY mistake_count DESC
      `,
      [userId],
    );

    res.json({
      message: "Weak topics fetched",
      weakTopics: rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMistakesByTopic = async (req, res) => {
  const userId = req.user.id;
  const { topicId } = req.params;

  try {
    const [rows] = await pool.execute(
      `
      SELECT 
        question_id,
        user_answer,
        correct_answer,
        created_at
      FROM mistakes
      WHERE user_id = ? AND topic_id = ?
      ORDER BY created_at DESC
      `,
      [userId, topicId],
    );

    res.json({
      topicId,
      mistakes: rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
