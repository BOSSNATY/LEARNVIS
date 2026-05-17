const pool = require("../config/db");
const { generatePlan } = require("../services/aiPlanner");

// POST /api/study-plans

exports.createStudyPlan = async (req, res) => {
  console.log("Create Study Plan Request Body:", req.body); // DEBUG
  
  const { subjectId, examDate, daily_time_minutes, targetScore, preferred_time } = req.body;
  const userId = req.user.userId;

  if (!subjectId || !daily_time_minutes) {
    return res.status(400).json({
      error: `subjectId (${subjectId}) and daily_time_minutes (${daily_time_minutes}) are required`,
    });
  }

  try {
    // 1. CHECK EXISTING PLAN
    const [existing] = await pool.execute(
      "SELECT id FROM study_plans WHERE user_id = ? AND subject_id = ?",
      [userId, subjectId],
    );

    if (existing.length > 0) {
      // Overwrite the existing plan
      await pool.execute("DELETE FROM study_tasks WHERE plan_id = ?", [existing[0].id]);
      await pool.execute("DELETE FROM study_plans WHERE id = ?", [existing[0].id]);
    }

    // 2. GET TOPICS FIRST (🔥 IMPORTANT CHECK)
    const [topics] = await pool.execute(
      `SELECT id 
       FROM topics 
       WHERE subject_id = ? 
       AND (is_custom = FALSE OR created_by = ?)`,
      [subjectId, userId],
    );

    // ❌ STOP HERE IF NO TOPICS
    if (topics.length === 0) {
      return res.status(400).json({
        error: "No topics found for this subject. Please add topics first.",
      });
    }

    // 3. CREATE PLAN ONLY AFTER VALIDATION
    const [result] = await pool.execute(
      `INSERT INTO study_plans 
       (user_id, subject_id, exam_date, daily_time_minutes, preferred_time)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        subjectId,
        examDate || null,
        daily_time_minutes,
        preferred_time || null
      ],
    );


    const planId = result.insertId;

    // 4. GENERATE TASKS
    const today = new Date();

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];

      const scheduledDate = new Date(today);
      scheduledDate.setDate(today.getDate() + i);

      await pool.execute(
        `INSERT INTO study_tasks 
         (plan_id, topic_id, scheduled_date, status, progress_percent, session_type)
         VALUES (?, ?, ?, 'pending', 0, 'learn')`,
        [planId, topic.id, scheduledDate.toISOString().split("T")[0]],
      );
    } // Close the for loop properly

    res.status(201).json({
      message: "Study plan created successfully",
      planId,
      tasksGenerated: topics.length,
    });
  } catch (err) {
    console.error("Create Study Plan Error:", err);
    res.status(500).json({ error: err.message });
  }
}

// POST /api/study-plans/:planId/generate
exports.generateDailyTasks = async (req, res) => {
  const { planId } = req.params;
  const userId = req.user.userId;
  const { topicIds } = req.body;

  if (!topicIds || !topicIds.length) {
    return res
      .status(400)
      .json({ error: "Please provide at least one topicId" });
  }

  try {
    // 1. Verify plan ownership
    const [[plan]] = await pool.execute(
      "SELECT * FROM study_plans WHERE id = ? AND user_id = ?",
      [planId, userId],
    );
    if (!plan) return res.status(404).json({ error: "Study plan not found" });

    // 2. Fetch topics
    const [topics] = await pool.query(
      "SELECT id, title, difficulty FROM topics WHERE id IN (?)",
      [topicIds],
    );
    if (!topics.length)
      return res.status(400).json({ error: "No valid topics found" });

    const cleanTopics = topics
      .filter((t) => t && t.title)
      .map((t) => ({
        id: t.id,
        title: t.title.trim(),
        difficulty: t.difficulty || "medium",
      }));

    // 3. Calculate total days
    let totalDays;
    if (plan.exam_date) {
      const daysUntilExam = Math.ceil(
        (new Date(plan.exam_date) - new Date()) / (1000 * 60 * 60 * 24),
      );
      totalDays = Math.max(daysUntilExam, 1);
    } else {
      totalDays = Math.max(cleanTopics.length * 2, 3);
    }

    // 4. Generate AI plan (with fallback)
    let aiPlan;
    try {
      aiPlan = await generatePlan(
        cleanTopics,
        totalDays,
        plan.daily_time_minutes,
        plan.target_score || 85,
      );
    } catch (err) {
      console.error("AI planner failed, using fallback:", err.message);
      aiPlan = cleanTopics.map((t, i) => ({
        day: i,
        type: "learn",
        parentTopic: t.title,
        subtopics: [t.title],
      }));
    }

    // 5. Clear old tasks and insert new ones
    await pool.execute("DELETE FROM study_tasks WHERE plan_id = ?", [planId]);

    const titleToTopic = {};
    for (const t of cleanTopics) {
      titleToTopic[t.title.toLowerCase()] = t;
    }

    const savedTasks = [];
    for (const dayPlan of aiPlan) {
      const dayOffset = Number(dayPlan.day);
      if (isNaN(dayOffset)) continue;

      const topic =
        titleToTopic[(dayPlan.parentTopic || "").toLowerCase().trim()];
      if (!topic) {
        console.warn(
          "Skipping unrecognized topic from AI plan:",
          dayPlan.parentTopic,
        );
        continue;
      }

      // Safely calculate the date in JS instead of MySQL
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + dayOffset);
      const formattedDate = scheduledDate.toISOString().split("T")[0];

      const rawType = dayPlan.type || dayPlan.sessionType || dayPlan.taskType;
      const taskType = (rawType && typeof rawType === "String") ?
      rawType.toLowerCase().trim() : "learn";

      const subtopicsString = Array.isArray(dayPlan.subtopics) 
        ? dayPlan.subtopics.join(", ") 
        : (dayPlan.subtopics || "General Review");

      const [taskRes] = await pool.execute(
        `INSERT INTO study_tasks (plan_id, topic_id, scheduled_date, session_type, status, progress_percent,subtopics)
         VALUES (?, ?, ?, ?, 'pending', 0,subtopics)`,
        [planId, topic.id, formattedDate, taskType,subtopicsString],
      );

      savedTasks.push({
        taskId: taskRes.insertId,
        topicId: topic.id,
        topicTitle: topic.title,
        day: dayOffset,
        type: dayPlan.type || "learn",
        subtopics: dayPlan.subtopics || [],
      });
    }

    res.json({
      message: "Study tasks generated",
      totalDays,
      totalTopics: cleanTopics.length,
      tasksCreated: savedTasks.length,
      tasks: savedTasks,
    });
  } catch (err) {
    console.error("Generate tasks error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/study-plans
exports.getMyPlans = async (req, res) => {
  const userId = req.user.userId;

  try {
    const [plans] = await pool.execute(
      `SELECT sp.*, s.name AS subject_name,
              COUNT(st.id) AS total_tasks,
              SUM(st.status = 'completed') AS completed_tasks,
              SUM(st.status = 'missed') AS missed_tasks
       FROM study_plans sp
       LEFT JOIN subjects s ON sp.subject_id = s.id
       LEFT JOIN study_tasks st ON st.plan_id = sp.id
       WHERE sp.user_id = ?
       GROUP BY sp.id
       ORDER BY sp.id DESC`,
      [userId],
    );
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/study-plans/:planId/tasks
exports.getPlanTasks = async (req, res) => {
  const { planId } = req.params;
  const userId = req.user.userId;

  try {
    const [[plan]] = await pool.execute(
      "SELECT id FROM study_plans WHERE id = ? AND user_id = ?",
      [planId, userId],
    );
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    const [tasks] = await pool.execute(
      `SELECT st.*, t.title AS topic_title, t.difficulty
       FROM study_tasks st
       JOIN topics t ON st.topic_id = t.id
       WHERE st.plan_id = ?
       ORDER BY st.scheduled_date ASC`,
      [planId],
    );

    res.json({ planId: Number(planId), tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/study-plans/:planId
exports.deletePlan = async (req, res) => {
  const { planId } = req.params;
  const userId = req.user.userId;

  try {
    const [[plan]] = await pool.execute(
      "SELECT id FROM study_plans WHERE id = ? AND user_id = ?",
      [planId, userId],
    );
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    await pool.execute("DELETE FROM study_tasks WHERE plan_id = ?", [planId]);
    await pool.execute("DELETE FROM study_plans WHERE id = ?", [planId]);

    res.json({ message: "Study plan deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
