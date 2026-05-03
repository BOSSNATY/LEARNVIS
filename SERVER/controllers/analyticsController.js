const pool = require("../config/db");

// GET /api/analytics/overview
exports.getOverview = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Total topics by learning state
    const [stateBreakdown] = await pool.execute(
      `SELECT status, COUNT(*) AS count
       FROM learning_state
       WHERE user_id = ?
       GROUP BY status`,
      [userId]
    );

    // Quiz performance over time
    const [quizHistory] = await pool.execute(
      `SELECT qa.score, qa.passed, qa.completed_at, t.title AS topic_title
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       JOIN topics t ON q.topic_id = t.id
       WHERE qa.user_id = ? AND qa.completed_at IS NOT NULL
       ORDER BY qa.completed_at DESC
       LIMIT 20`,
      [userId]
    );

    // Study session hours
    const [[sessionStats]] = await pool.execute(
      `SELECT 
         COUNT(*) AS total_sessions,
         SUM(TIMESTAMPDIFF(MINUTE, start_time, COALESCE(end_time, NOW()))) AS total_minutes,
         AVG(focus_score) AS avg_focus,
         AVG(fatigue_level) AS avg_fatigue
       FROM study_session
       WHERE user_id = ? AND start_time IS NOT NULL`,
      [userId]
    );

    // Task completion rate
    const [[taskStats]] = await pool.execute(
      `SELECT 
         COUNT(*) AS total,
         SUM(status = 'completed') AS completed,
         SUM(status = 'missed') AS missed,
         SUM(status = 'pending') AS pending
       FROM study_tasks st
       JOIN study_plans sp ON st.plan_id = sp.id
       WHERE sp.user_id = ?`,
      [userId]
    );

    // Top weak concepts
    const [weakConcepts] = await pool.execute(
      `SELECT concept_tag, SUM(frequency) AS frequency
       FROM mistake_profiles
       WHERE user_id = ?
       GROUP BY concept_tag
       ORDER BY frequency DESC
       LIMIT 5`,
      [userId]
    );

    res.json({
      learningState: stateBreakdown,
      quizHistory,
      sessions: {
        total: sessionStats.total_sessions || 0,
        totalMinutes: Math.round(sessionStats.total_minutes || 0),
        avgFocusScore: sessionStats.avg_focus
          ? Math.round(sessionStats.avg_focus * 10) / 10
          : null,
        avgFatigueLevel: sessionStats.avg_fatigue
          ? Math.round(sessionStats.avg_fatigue * 10) / 10
          : null,
      },
      tasks: taskStats,
      weakConcepts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/analytics/subject/:subjectId
exports.getSubjectAnalytics = async (req, res) => {
  const userId = req.user.userId;
  const { subjectId } = req.params;

  try {
    const [topicProgress] = await pool.execute(
      `SELECT t.id, t.title, t.difficulty,
              ls.status, ls.mastery_score, ls.progress_percent,
              COUNT(DISTINCT m.id) AS mistake_count,
              MAX(qa.score) AS best_quiz_score
       FROM topics t
       LEFT JOIN learning_state ls ON ls.topic_id = t.id AND ls.user_id = ?
       LEFT JOIN mistakes m ON m.topic_id = t.id AND m.user_id = ?
       LEFT JOIN quizzes qz ON qz.topic_id = t.id
       LEFT JOIN quiz_attempts qa ON qa.quiz_id = qz.id AND qa.user_id = ?
       WHERE t.subject_id = ?
       GROUP BY t.id`,
      [userId, userId, userId, subjectId]
    );

    const mastered = topicProgress.filter((t) => t.status === "mastered").length;
    const total = topicProgress.length;

    res.json({
      subjectId,
      totalTopics: total,
      mastered,
      masteryPercent: total ? Math.round((mastered / total) * 100) : 0,
      topics: topicProgress,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/analytics/mistakes
exports.getMistakeAnalysis = async (req, res) => {
  const userId = req.user.userId;

  try {
    const [byTopic] = await pool.execute(
      `SELECT t.title AS topic, COUNT(m.id) AS count
       FROM mistakes m
       JOIN topics t ON m.topic_id = t.id
       WHERE m.user_id = ?
       GROUP BY m.topic_id
       ORDER BY count DESC`,
      [userId]
    );

    const [byConcept] = await pool.execute(
      `SELECT concept_tag, SUM(frequency) AS frequency
       FROM mistake_profiles
       WHERE user_id = ?
       GROUP BY concept_tag
       ORDER BY frequency DESC`,
      [userId]
    );

    const [recent] = await pool.execute(
      `SELECT m.created_at, t.title AS topic, q.question_text,
              m.user_answer, m.correct_answer
       FROM mistakes m
       JOIN topics t ON m.topic_id = t.id
       LEFT JOIN questions q ON m.question_id = q.id
       WHERE m.user_id = ?
       ORDER BY m.created_at DESC
       LIMIT 10`,
      [userId]
    );

    res.json({ byTopic, byConcept, recentMistakes: recent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
