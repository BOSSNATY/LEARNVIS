const pool = require("../config/db");

exports.startSession = async (req, res) => {
  const userId = req.user.id;
  const { topic_id, planned_duration, session_type, day_number } = req.body;

  try {
    const [result] = await pool.execute(
      `INSERT INTO study_session
      (user_id, topic_id, start_time, planned_duration, session_type, day_number)
      VALUES (?, ?, NOW(), ?, ?, ?)`,
      [userId, topic_id, planned_duration, session_type, day_number],
    );

    res.json({
      message: "Session started",
      sessionId: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.endSession = async (req, res) => {
  const userId = req.user.id;
  const { session_id, focus_score, fatigue_level } = req.body;

  try {
    await pool.execute(
      `UPDATE study_session
       SET end_time = NOW(),
           focus_score = ?,
           fatigue_level = ?
       WHERE id = ? AND user_id = ?`,
      [focus_score, fatigue_level, session_id, userId],
    );

    res.json({ message: "Session ended" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.startFromTask = async (req, res) => {
  const userId = req.user.id;
  const { taskId } = req.params;

  try {
    // 1. Get task (must belong to user via plan)
    const [tasks] = await pool.execute(
      `
      SELECT st.*, tp.title
      FROM study_tasks st
      JOIN study_plans sp ON st.plan_id = sp.id
      JOIN topics tp ON st.topic_id = tp.id
      WHERE st.id = ? AND sp.user_id = ?
      `,
      [taskId, userId],
    );

    if (tasks.length === 0) {
      return res.status(404).json({
        error: "Task not found or not authorized",
      });
    }

    const task = tasks[0];

    // 2. Create session from task
    const [result] = await pool.execute(
      `
      INSERT INTO study_session
      (user_id, topic_id, start_time, planned_duration, session_type, day_number)
      VALUES (?, ?, NOW(), ?, ?, ?)
      `,
      [
        userId,
        task.topic_id,
        task.planned_duration || 60,
        task.session_type || "learn",
        task.day_number || 0,
      ],
    );

    res.json({
      message: "Study session started from task",
      sessionId: result.insertId,
      topic: task.title,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
