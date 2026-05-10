const pool = require("../config/db");
const { buildTopicContent } = require("../services/contentService");

exports.startSession = async (req, res) => {
  const userId = req.user.id;
  const { topic_id, planned_duration, session_type } = req.body;

  try {
    const [result] = await pool.execute(
      `INSERT INTO study_session
      (user_id, topic_id, start_time, session_type)
      VALUES (?, ?, NOW(), ?)`,
      [userId, task.topic_id, task.session_type || "learn"]
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
    // End session and calculate exact time spent
    await pool.execute(
      `UPDATE study_session
       SET end_time = NOW(),
           focus_score = ?,
           fatigue_level = ?
       WHERE id = ? AND user_id = ?`,
      [focus_score || null, fatigue_level || null, session_id, userId]
    );

    // Retrieve the exact time spent from the DB
    const [[session]] = await pool.execute(
      `SELECT TIMESTAMPDIFF(MINUTE, start_time, end_time) as time_spent 
       FROM study_session 
       WHERE id = ?`,
      [session_id]
    );

    res.json({ 
      message: "Session ended",
      timeSpentMinutes: Math.max(session.time_spent, 1) 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.startFromTask = async (req, res) => {
  const userId = req.user.id;
  const { taskId } = req.params;

  try {
    // 1. Get task details
    const [tasks] = await pool.execute(
      `SELECT st.*, tp.title
       FROM study_tasks st
       JOIN study_plans sp ON st.plan_id = sp.id
       JOIN topics tp ON st.topic_id = tp.id
       WHERE st.id = ? AND sp.user_id = ?`,
      [taskId, userId],
    );

    if (tasks.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    const task = tasks[0];

    // 2. Start Session
    const [result] = await pool.execute(
      `INSERT INTO study_session
      (user_id, topic_id, start_time, session_type)
      VALUES (?, ?, NOW(), ?)`,
      [userId, task.topic_id, task.session_type || "learn"]
    );


    // 3. Fetch AI Learning Content so the student can actually learn!
    const content = await buildTopicContent(task.topic_id, userId);

    res.json({
      message: "Study session started from task",
      sessionId: result.insertId,
      topic: task.title,
      content: content // Send content to frontend immediately
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
