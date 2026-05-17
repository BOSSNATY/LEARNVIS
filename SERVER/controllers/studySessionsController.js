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
  const { sessionId, taskId, focusScore } = req.body;

  // 1. Calculate time spent automatically
  const [[session]] = await pool.execute("SELECT start_time FROM study_sessions WHERE id = ?", [sessionId]);
  const timeSpentMinutes = Math.round((new Date() - new Date(session.start_time)) / 60000);

  // 2. Update Session
  await pool.execute(
    "UPDATE study_sessions SET end_time = NOW(), focus_score = ?, status = 'completed', progress = 100 WHERE id = ?",
    [focusScore || 80, sessionId]
  );

  // 3. Update Task in ONE go
  if (taskId) {
    await pool.execute(
      "UPDATE study_tasks SET status = 'completed', time_spent = ?, progress_percent = 100 WHERE id = ?",
      [timeSpentMinutes, taskId]
    );
  }

  res.json({ message: "Session tracked successfully!", timeSpent: timeSpentMinutes });
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
