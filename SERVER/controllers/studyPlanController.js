const pool = require("../config/db");
const { generatePlan } = require("../services/aiPlanner");

// POST /api/study-plans
exports.createStudyPlan = async (req, res) => {
  const { subjectId, examDate, dailyTimeMinutes, targetScore, target_score } =
    req.body;
  const userId = req.user.userId;
  const requestedTargetScore = targetScore || target_score || 85;

  if (!subjectId || !dailyTimeMinutes) {
    return res
      .status(400)
      .json({ error: "subjectId and dailyTimeMinutes are required" });
  }

  try {
    const [existing] = await pool.execute(
      "SELECT id FROM study_plans WHERE user_id = ? AND subject_id = ?",
      [userId, subjectId],
    );
    if (existing.length > 0) {
      return res.status(400).json({
        error: "A study plan already exists for this subject",
        existingPlanId: existing[0].id,
      });
    }

    let result;
    try {
      [result] = await pool.execute(
        "INSERT INTO study_plans (user_id, subject_id, exam_date, daily_time_minutes, target_score) VALUES (?, ?, ?, ?, ?)",
        [
          userId,
          subjectId,
          examDate || null,
          dailyTimeMinutes,
          requestedTargetScore,
        ],
      );
    } catch (insertErr) {
      if (insertErr.code !== "ER_BAD_FIELD_ERROR") throw insertErr;
      [result] = await pool.execute(
        "INSERT INTO study_plans (user_id, subject_id, exam_date, daily_time_minutes) VALUES (?, ?, ?, ?)",
        [userId, subjectId, examDate || null, dailyTimeMinutes],
      );
    }

    res.status(201).json({
      message: "Study plan created",
      planId: result.insertId,
      targetScore: requestedTargetScore,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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

      const [taskRes] = await pool.execute(
        `INSERT INTO study_tasks (plan_id, topic_id, scheduled_date, session_type)
         VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL ? DAY), ?)`,
        [planId, topic.id, dayOffset, dayPlan.type || "learn"],
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
