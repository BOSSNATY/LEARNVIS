const pool = require("../config/db");

// GET /api/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD
exports.getCalendar = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const start =
    req.query.start ||
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10);
  const end =
    req.query.end ||
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);

  try {
    const [tasks] = await pool.execute(
      `SELECT st.id, st.plan_id, st.topic_id, st.scheduled_date, st.day_number,
              st.session_type, st.status, t.title AS topic_title,
              t.difficulty, s.name AS subject_name
       FROM study_tasks st
       JOIN study_plans sp ON st.plan_id = sp.id
       JOIN topics t ON st.topic_id = t.id
       JOIN subjects s ON t.subject_id = s.id
       WHERE sp.user_id = ?
         AND DATE(st.scheduled_date) BETWEEN DATE(?) AND DATE(?)
       ORDER BY st.scheduled_date ASC, st.id ASC`,
      [userId, start, end],
    );

    const days = tasks.reduce((acc, task) => {
      const dateKey = new Date(task.scheduled_date).toISOString().slice(0, 10);
      if (!acc[dateKey]) acc[dateKey] = { date: dateKey, tasks: [] };
      acc[dateKey].tasks.push(task);
      return acc;
    }, {});

    res.json({
      start,
      end,
      days: Object.values(days),
      tasks,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/calendar/complete-session
exports.completeSession = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { taskId, focus_score = 100, fatigue_level = 1 } = req.body;

  try {
    if (taskId) {
      const [tasks] = await pool.execute(
        `SELECT st.id
         FROM study_tasks st
         JOIN study_plans sp ON st.plan_id = sp.id
         WHERE st.id = ? AND sp.user_id = ?`,
        [taskId, userId],
      );

      if (!tasks.length) {
        return res
          .status(404)
          .json({ error: "Task not found or unauthorized" });
      }

      await pool.execute(
        "UPDATE study_tasks SET status = 'completed' WHERE id = ?",
        [taskId],
      );
    }

    await pool.execute(
      `INSERT INTO study_session (user_id, start_time, end_time, focus_score, fatigue_level)
       VALUES (?, DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), ?, ?)`,
      [userId, focus_score, fatigue_level],
    );

    res.json({ message: "Calendar session completed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
