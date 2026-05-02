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
        st.day_number,
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
    // 1. Verify ownership
    const [tasks] = await pool.execute(
      `
      SELECT st.id
      FROM study_tasks st
      JOIN study_plans sp ON st.plan_id = sp.id
      WHERE st.id = ? AND sp.user_id = ?
      `,
      [taskId, userId],
    );

    if (!tasks.length) {
      return res.status(404).json({
        error: "Task not found or unauthorized",
      });
    }

    // 2. Mark as completed
    await pool.execute(
      `
      UPDATE study_tasks
      SET status = 'completed'
      WHERE id = ?
      `,
      [taskId],
    );

    // 3. Optional: store performance
    if (time_spent_minutes || understanding_score) {
      await pool.execute(
        `
        UPDATE study_tasks
        SET time_spent = ?, understanding_score = ?
        WHERE id = ?
        `,
        [time_spent_minutes, understanding_score, taskId],
      );
    }

    res.json({
      message: "Task marked as completed",
    });
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
