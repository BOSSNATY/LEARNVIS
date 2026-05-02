const pool = require("../config/db");

exports.startStudySession = async (req, res) => {
  const userId = req.user.userId;

  const {
    topicId,
    plannedDuration,
    sessionType = "learn",
    dayNumber,
  } = req.body;

  try {
    const [result] = await pool.execute(
      `INSERT INTO study_sessions
      (user_id, topic_id, planned_duration, session_type, day_number)
      VALUES (?, ?, ?, ?, ?)`,
      [userId, topicId, plannedDuration, sessionType, dayNumber],
    );

    await pool.execute(
      `UPDATE learning_state
       SET status = 'learning'
       WHERE user_id = ? AND topic_id = ?`,
      [userId, topicId],
    );

    res.json({
      message: "Session started",
      sessionId: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.endStudySession = async (req, res) => {
  const userId = req.user.userId;

  const { sessionId, focusScore = 100, fatigueLevel = "normal" } = req.body;

  try {
    // 1. Close session
    await pool.execute(
      `UPDATE study_sessions
       SET end_time = NOW(),
           focus_score = ?,
           fatigue_level = ?
       WHERE id = ? AND user_id = ?`,
      [focusScore, fatigueLevel, sessionId, userId],
    );

    // 2. Get session data
    const [sessionRows] = await pool.execute(
      `SELECT topic_id FROM study_sessions WHERE id = ?`,
      [sessionId],
    );

    const topicId = sessionRows[0]?.topic_id;

    if (!topicId) {
      return res.status(400).json({ error: "Invalid session" });
    }

    // 3. Weighted progress calculation
    let boost = 10;

    if (focusScore >= 80) boost += 5;
    if (focusScore >= 90) boost += 5;

    if (fatigueLevel === "low") boost += 5;
    if (fatigueLevel === "high") boost -= 5;

    // 4. Update learning state
    const [stateRows] = await pool.execute(
      `SELECT progress_percent FROM learning_state
       WHERE user_id = ? AND topic_id = ?`,
      [userId, topicId],
    );

    let current = stateRows[0]?.progress_percent || 0;
    let newProgress = Math.min(current + boost, 100);

    let status = "learning";

    if (newProgress >= 100) {
      status = "practicing";
    }

    await pool.execute(
      `UPDATE learning_state
       SET progress_percent = ?,
           status = ?
       WHERE user_id = ? AND topic_id = ?`,
      [newProgress, status, userId, topicId],
    );

    res.json({
      message: "Session completed",
      focusScore,
      fatigueLevel,
      progress: newProgress,
      status,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
