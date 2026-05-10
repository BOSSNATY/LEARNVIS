const pool = require("../config/db");

exports.getTodayTasks = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Get today's date (normalized)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. Fetch tasks for today
    const [tasks] = await pool.execute(
      `
      SELECT 
        st.id,
        st.plan_id,
        st.topic_id,
        st.scheduled_date,
        st.session_type,
        t.title AS topic_title,
        t.difficulty
      FROM study_tasks st
      JOIN study_plans sp ON st.plan_id = sp.id
      JOIN topics t ON st.topic_id = t.id
      WHERE sp.user_id = ?
        AND DATE(st.scheduled_date) = DATE(?)
      ORDER BY st.id ASC
      `,
      [userId, today],
    );

    if (!tasks.length) {
      return res.json({
        message: "No tasks scheduled for today",
        tasks: [],
      });
    }

    res.json({
      message: "Today's tasks fetched",
      count: tasks.length,
      tasks,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.completeTask = async (req, res) => {
  const userId = req.user.id;
  const { taskId } = req.params;
  const { time_spent_minutes, understanding_score } = req.body;

  try {
    const [tasks] = await pool.execute(
      `SELECT st.id, st.topic_id, sp.subject_id
       FROM study_tasks st
       JOIN study_plans sp ON st.plan_id = sp.id
       WHERE st.id = ? AND sp.user_id = ?`,
      [taskId, userId],
    );

    if (!tasks.length) return res.status(404).json({ error: "Task not found" });
    const task = tasks[0];

    // 1. Mark task as completed
    await pool.execute(
      `UPDATE study_tasks
       SET status = 'completed', time_spent = ?, understanding_score = ?, progress_percent = 100
       WHERE id = ?`,
      [time_spent_minutes || 0, understanding_score || null, taskId],
    );

    // 2. Update Global Progress / Mastery Score
    if (understanding_score) {
      await pool.execute(
        `INSERT INTO learning_state 
        (user_id, subject_id, topic_id, status, progress_percent, mastery_score)
        VALUES (?, ?, ?, 'learning', 100, ?)
        ON DUPLICATE KEY UPDATE
          progress_percent = 100,
          mastery_score = GREATEST(IFNULL(mastery_score, 0), ?),
          updated_at = CURRENT_TIMESTAMP`,
        [userId, task.subject_id, task.topic_id, understanding_score, understanding_score],
      );
    }

    res.json({ message: "Task marked as completed and progress updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.markMissedTasks = async () => {
  try {
    await pool.execute(`
      UPDATE study_tasks
      SET status = 'missed'
      WHERE status = 'pending'
        AND scheduled_date < CURDATE()
    `);

    console.log("Missed tasks updated");
  } catch (err) {
    console.error("Failed to update missed tasks:", err.message);
  }
};
