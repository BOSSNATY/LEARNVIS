const pool = require("../config/db");

exports.initLearningState = async (req, res) => {
  const userId = req.user.userId;
  const { subjectId } = req.body;

  try {
    // get all topics under subject
    const [topics] = await pool.execute(
      "SELECT id FROM topics WHERE subject_id = ?",
      [subjectId],
    );

    // create learning state for each topic
    const values = topics.map((t) => [userId, subjectId, t.id]);

    await pool.query(
      `INSERT INTO learning_state 
      (user_id, subject_id, topic_id)
      VALUES ?`,
      [values],
    );

    res.json({
      message: "Learning state initialized",
      topicsTracked: topics.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLearningState = async (req, res) => {
  const userId = req.user.userId;

  try {
    const [data] = await pool.execute(
      `
      SELECT 
        ls.id,
        ls.status,
        ls.progress_percent,
        ls.mastery_score,
        t.title AS topic,
        s.name AS subject
      FROM learning_state ls
      JOIN topics t ON ls.topic_id = t.id
      JOIN subjects s ON ls.subject_id = s.id
      WHERE ls.user_id = ?
    `,
      [userId],
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateLearningState = async (req, res) => {
  const { topicId, status, progress_percent, mastery_score } = req.body;
  const userId = req.user.id;

  try {
    await pool.execute(
      `INSERT INTO learning_state 
      (user_id, subject_id, topic_id, status, progress_percent, mastery_score)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        progress_percent = VALUES(progress_percent),
        mastery_score = VALUES(mastery_score),
        updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        req.body.subjectId,
        topicId,
        status,
        progress_percent,
        mastery_score,
      ],
    );

    res.json({ message: "Learning state updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
