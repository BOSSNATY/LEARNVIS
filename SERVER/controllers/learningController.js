const pool = require("../config/db");

exports.startLearning = async (req, res) => {
  const userId = req.user.userId;

  const {
    topicId,
    subjectId,
    hoursPerDay,
    mode, // "exam" or "normal"
    daysLeft, // optional
    notes,
    pastExam,
  } = req.body;

  try {
    // ==============================
    // 1. GENERATE OR REFINE CONTENT
    // ==============================

    let contentText = "";

    if (!notes && !pastExam) {
      contentText = await generateAI(`
    Explain this topic in structured way:
    - concepts
    - examples
    - formulas

    Topic ID: ${topicId}
    `);
    } else {
      contentText = await generateAI(`
    Convert this into structured study notes:

    Notes:
    ${notes || "N/A"}

    Past Exam:
    ${pastExam || "N/A"}
    `);
    }

    // Save content
    const [contentResult] = await pool.execute(
      `INSERT INTO content (topic_id, type, text_content)
       VALUES (?, 'text', ?)`,
      [topicId, contentText],
    );

    // ==============================
    // 2. ESTIMATE STUDY DAYS
    // ==============================

    const contentLength = contentText.length;

    let totalDays = estimateDays(contentLength, hoursPerDay);

    // ⚠️ IMPORTANT: DO NOT FORCE LONG PLAN
    if (mode === "exam" && daysLeft) {
      totalDays = Math.min(totalDays, daysLeft);
    }

    // ==============================
    // 3. CREATE STUDY SESSIONS
    // ==============================

    const sessions = [];

    for (let day = 1; day <= totalDays; day++) {
      sessions.push([userId, topicId, hoursPerDay * 60, "learn", day]);

      // Add quiz session AFTER learning chunk
      sessions.push([
        userId,
        topicId,
        30, // fixed quiz duration
        "quiz",
        day,
      ]);
    }

    await pool.query(
      `INSERT INTO study_sessions 
      (user_id, topic_id, planned_duration, session_type, day_number)
      VALUES ?`,
      [sessions],
    );

    // ==============================
    // 4. INIT LEARNING STATE
    // ==============================

    await pool.execute(
      `INSERT INTO learning_state
       (user_id, subject_id, topic_id, status, progress_percent)
       VALUES (?, ?, ?, 'learning', 0)
       ON DUPLICATE KEY UPDATE status='learning'`,
      [userId, subjectId, topicId],
    );

    // ==============================
    // 5. MICRO-REVISION HOOK
    // ==============================

    // schedule revision sessions later (after mastery)
    // we just mark it for future logic

    res.json({
      message: "Learning started successfully",
      totalDays,
      sessionsCreated: sessions.length,
      note: "Plan adapts to content size, not forced duration",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
