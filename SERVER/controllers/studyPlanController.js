const pool = require("../config/db");
const { generatePlan } = require("../services/aiPlanner");

// ==========================================
// ✅ 1. CREATE STUDY PLAN
// ==========================================
exports.createStudyPlan = async (req, res) => {
  const { subjectId, examDate, dailyTimeMinutes } = req.body;
  const userId = req.user.userId;

  try {
    // Check if plan already exists
    const [existing] = await pool.execute(
      `SELECT id FROM study_plans 
   WHERE user_id = ? AND subject_id = ?`,
      [userId, subjectId],
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: "Study plan already exists for this subject",
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO study_plans 
       (user_id, subject_id, exam_date, daily_time_minutes)
       VALUES (?, ?, ?, ?)`,
      [userId, subjectId, examDate || null, dailyTimeMinutes],
    );

    res.status(201).json({
      message: "Study plan created",
      planId: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// ✅ 2. GENERATE DAILY TASKS
// ==========================================

exports.generateDailyTasks = async (req, res) => {
  const { planId } = req.params;
  const userId = req.user.userId;
  const { topicIds } = req.body;

  try {
    // 1. Validation
    if (!topicIds || topicIds.length === 0) {
      return res.status(400).json({
        error: "Please select at least one topic",
      });
    }

    // 2. Get study plan
    const [plans] = await pool.execute(
      `SELECT * FROM study_plans WHERE id = ? AND user_id = ?`,
      [planId, userId],
    );

    if (!plans.length) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const plan = plans[0];

    // 3. Get topics
    const [topics] = await pool.query(
      `SELECT id, title, difficulty FROM topics WHERE id IN (?)`,
      [topicIds],
    );

    if (!topics.length) {
      return res.status(400).json({ error: "No valid topics found" });
    }

    const cleanTopics = topics
      .filter((t) => t && t.title)
      .map((t) => ({
        id: t.id,
        title: t.title.trim(),
        difficulty: t.difficulty || "medium",
      }));

    // 4. Clear old tasks
    await pool.execute(`DELETE FROM study_tasks WHERE plan_id = ?`, [planId]);

    // 5. Determine totalDays (SMART MODE)
    let totalDays;

    if (plan.exam_date) {
      const today = new Date();
      const examDate = new Date(plan.exam_date);

      totalDays = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));

      totalDays = Math.max(totalDays, 1);
    } else if (plan.duration_days) {
      totalDays = plan.duration_days;
    } else {
      // AI decides pacing
      totalDays = Math.max(cleanTopics.length * 2, 3);
    }

    // 6. AI PLAN GENERATION
    let aiPlan;

    try {
      aiPlan = await generatePlan(
        cleanTopics,
        totalDays,
        plan.daily_time_minutes,
      );
    } catch (err) {
      console.error("AI failed:", err.message);

      // SAFE FALLBACK
      aiPlan = cleanTopics.map((t, i) => ({
        day: i,
        type: "learn",
        parentTopic: t.title,
        subtopics: [t.title],
      }));
    }

    console.log("AI PLAN:", JSON.stringify(aiPlan, null, 2));

    // 7. SAVE TO DB
    const tasks = [];

    for (const dayPlan of aiPlan) {
      const dayOffset = Number(dayPlan.day);
      if (isNaN(dayOffset)) continue;

      const topic = cleanTopics.find(
        (t) =>
          t.title.toLowerCase().trim() ===
          (dayPlan.parentTopic || "").toLowerCase().trim(),
      );

      if (!topic) {
        console.warn("Skipping invalid topic:", dayPlan.parentTopic);
        continue;
      }

      await pool.execute(
        `INSERT INTO study_tasks 
        (plan_id, topic_id, scheduled_date)
        VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL ? DAY))`,
        [planId, topic.id, dayOffset],
      );

      tasks.push({
        topicId: topic.id,
        day: dayOffset,
        type: dayPlan.type || "learn",
        subtopics: dayPlan.subtopics || [],
      });
    }

    return res.json({
      message: "Study tasks generated",
      totalDays,
      totalTopics: cleanTopics.length,
      tasks,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ==========================================
// ✅ 3. GET MY STUDY PLANS
// ==========================================
exports.getMyPlans = async (req, res) => {
  const userId = req.user.userId;

  try {
    const [plans] = await pool.execute(
      `SELECT * FROM study_plans 
       WHERE user_id = ?
       ORDER BY id DESC`,
      [userId],
    );

    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// ✅ 4. GET PLAN TASKS
// ==========================================
exports.getPlanTasks = async (req, res) => {
  const { planId } = req.params;
  const userId = req.user.id;

  try {
    // 1. Validate ownership
    const [plans] = await pool.execute(
      `SELECT id FROM study_plans WHERE id = ? AND user_id = ?`,
      [planId, userId],
    );

    if (plans.length === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // 2. Get tasks
    const [tasks] = await pool.execute(
      `SELECT st.*, t.title AS topic_title
       FROM study_tasks st
       JOIN topics t ON st.topic_id = t.id
       WHERE st.plan_id = ?
       ORDER BY st.scheduled_date ASC`,
      [planId],
    );

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
