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
      (
        SELECT 
          st.id, st.plan_id, st.topic_id, st.scheduled_date, st.session_type, st.status,
          t.title AS topic_title, t.difficulty
        FROM study_tasks st
        JOIN study_plans sp ON st.plan_id = sp.id
        JOIN topics t ON st.topic_id = t.id
        WHERE sp.user_id = ? AND st.status = 'completed'
        ORDER BY st.scheduled_date DESC, st.id DESC
        LIMIT 2
      )
      UNION ALL
      (
        SELECT 
          st.id, st.plan_id, st.topic_id, st.scheduled_date, st.session_type, st.status,
          t.title AS topic_title, t.difficulty
        FROM study_tasks st
        JOIN study_plans sp ON st.plan_id = sp.id
        JOIN topics t ON st.topic_id = t.id
        WHERE sp.user_id = ? AND st.status IN ('pending', 'missed')
        ORDER BY st.scheduled_date ASC, st.id ASC
        LIMIT 3
      )
      ORDER BY status ASC, scheduled_date ASC
      `,
      [userId, userId], // Note: We pass userId twice because there are two '?' in the query now
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
    // 1. Fetch the task and the overall plan context
    const [tasks] = await pool.execute(
      `SELECT st.id, st.topic_id, st.plan_id, sp.subject_id
       FROM study_tasks st
       JOIN study_plans sp ON st.plan_id = sp.id
       WHERE st.id = ? AND sp.user_id = ?`,
      [taskId, userId],
    );
    if (!tasks.length) return res.status(404).json({ error: "Task not found" });
    const task = tasks[0];
    // 2. Mark this specific task as completed
    await pool.execute(
      `UPDATE study_tasks
       SET status = 'completed', understanding_score = ?, progress_percent = 100 , time_spent = ?
       WHERE id = ?`,
      [understanding_score || null, time_spent_minutes || null, taskId],
    );
    // 3. 🧠 DYNAMIC CALCULATION: Look at ALL tasks for this topic in the current plan
    const [allTopicTasks] = await pool.execute(
      "SELECT status FROM study_tasks WHERE plan_id = ? AND topic_id = ?",
      [task.plan_id, task.topic_id],
    );
    const total = allTopicTasks.length;
    const completed = allTopicTasks.filter(
      (t) => t.status === "completed",
    ).length;
    const calculatedProgress = Math.round((completed / total) * 100);
    // 4. Update the GLOBAL Learning State (Mastery Score)
    // We use the student's self-reported understanding_score as the initial Mastery Score!
    await pool.execute(
      `INSERT INTO learning_state (user_id, subject_id, topic_id, status, progress_percent, mastery_score)
       VALUES (?, ?, ?, 'Learning', ?, ?)
       ON DUPLICATE KEY UPDATE 
         status = CASE WHEN ? >= 100 THEN 'Practicing' ELSE 'Learning' END,
         progress_percent = ?,
         mastery_score = GREATEST(mastery_score, ?),
         updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        task.subject_id,
        task.topic_id,
        calculatedProgress,
        understanding_score || 0,
        calculatedProgress,
        calculatedProgress,
        understanding_score || 0,
      ],
    );
    res.json({ message: "Task completed!", progress: calculatedProgress });
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
