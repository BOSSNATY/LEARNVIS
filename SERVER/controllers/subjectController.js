const pool = require("../config/db");

exports.createSubject = async (req, res) => {
  let { name, description } = req.body;

  name = name.trim().toLowerCase(); // normalize

  try {
    // Check if subject already exists
    const [existing] = await pool.execute(
      "SELECT id FROM subjects WHERE name = ?",
      [name],
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: "Subject already exists",
      });
    }

    // Insert new subject
    const [result] = await pool.execute(
      "INSERT INTO subjects (name, description) VALUES (?, ?)",
      [name, description],
    );

    res.status(201).json({
      message: "Subject created",
      subjectId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getUserSubjects = async (req, res) => {
  const userId = req.user.userId;

  try {
    const [subjects] = await pool.execute(
      "SELECT s.id, s.name, s.description " +
        "FROM subjects s " +
        "JOIN user_subjects us ON s.id = us.subject_id " +
        "WHERE us.user_id = ?",
      [userId],
    );

    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.selectSubjects = async (req, res) => {
  const userId = req.user.userId;
  let { subjectId, subjects } = req.body;

  // Normalize to array
  let subjectIds = [];

  if (Array.isArray(subjects)) {
    subjectIds = subjects;
  } else if (subjectId) {
    subjectIds = [subjectId];
  } else {
    return res.status(400).json({ error: "No subject(s) provided" });
  }

  try {
    // Remove duplicates (optional safety)
    subjectIds = [...new Set(subjectIds)];

    // Prepare bulk insert
    const values = subjectIds.map((id) => [userId, id]);

    await pool.query(
      "INSERT IGNORE INTO user_subjects (user_id, subject_id) VALUES ?",
      [values],
    );

    res.json({ message: "Subjects added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
