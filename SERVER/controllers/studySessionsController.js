const pool = require("../config/db");
const { buildTopicContent } = require("../services/contentService");

exports.startSession = async (req, res) => {
  const userId = req.user.id;
  const { topic_id, planned_duration, session_type } = req.body;

  try {
    const [result] = await pool.execute(
      `INSERT INTO study_sessions
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
      `UPDATE study_sessions
       SET end_time = NOW(),
           focus_score = ?,
           fatigue_level = ?
       WHERE id = ? AND user_id = ?`,
      [focus_score || null, fatigue_level || null, session_id, userId]
    );

    // Retrieve the exact time spent from the DB
    const [[session]] = await pool.execute(
      `SELECT TIMESTAMPDIFF(MINUTE, start_time, end_time) as time_spent 
       FROM study_sessions 
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

    // 2. Start Session (Prevent Duplicates)
    const [existingSession] = await pool.execute(
      `SELECT id FROM study_sessions 
       WHERE user_id = ? AND topic_id = ? AND status = 'active'`,
      [userId, task.topic_id]
    );

    let sessionId;
    if (existingSession.length > 0) {
      sessionId = existingSession[0].id;
    } else {
      const [result] = await pool.execute(
        `INSERT INTO study_sessions
        (user_id, topic_id, start_time, session_type, status, progress)
        VALUES (?, ?, NOW(), ?, 'active', 0)`,
        [userId, task.topic_id, task.session_type || "learn"]
      );
      sessionId = result.insertId;
    }


    
    

    res.json({
      message: "Study session started from task",
      sessionId: sessionId,
      topic: task.title,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
