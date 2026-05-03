const pool = require("../config/db");

// GET /api/prediction/:subjectId
exports.getPrediction = async (req, res) => {
  const userId = req.user.userId;
  const { subjectId } = req.params;

  try {
    // 1. Mock exam history for this subject
    const [mockScores] = await pool.execute(
      `SELECT score, submitted_at FROM mock_exams
       WHERE user_id = ? AND subject_id = ? AND score IS NOT NULL
       ORDER BY submitted_at DESC LIMIT 5`,
      [userId, subjectId],
    );

    // 2. Quiz performance across all topics in subject
    const [quizPerf] = await pool.execute(
      `SELECT AVG(qa.score) AS avg_score, MAX(qa.score) AS best_score,
              COUNT(*) AS total_attempts
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       JOIN topics t ON q.topic_id = t.id
       WHERE qa.user_id = ? AND t.subject_id = ? AND qa.completed_at IS NOT NULL`,
      [userId, subjectId],
    );

    // 3. Mastery rate
    const [[masteryStats]] = await pool.execute(
      `SELECT 
         COUNT(*) AS total_topics,
         SUM(ls.status = 'mastered') AS mastered,
         AVG(ls.mastery_score) AS avg_mastery_score
       FROM topics t
       LEFT JOIN learning_state ls ON ls.topic_id = t.id AND ls.user_id = ?
       WHERE t.subject_id = ?`,
      [userId, subjectId],
    );

    // 4. Study consistency (sessions in last 7 days)
    const [[consistency]] = await pool.execute(
      `SELECT COUNT(DISTINCT DATE(ss.start_time)) AS active_days
       FROM study_session ss
       JOIN study_tasks st ON ss.topic_id = st.topic_id
       JOIN study_plans sp ON st.plan_id = sp.id
       WHERE ss.user_id = ? AND sp.subject_id = ?
         AND ss.start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [userId, subjectId],
    );

    // 5. Compute predicted score
    const quizAvg = quizPerf[0]?.avg_score || 0;
    const mockAvg = mockScores.length
      ? mockScores.reduce((s, m) => s + m.score, 0) / mockScores.length
      : null;
    const masteryRate = masteryStats.total_topics
      ? (masteryStats.mastered / masteryStats.total_topics) * 100
      : 0;
    const consistencyScore = Math.min((consistency.active_days / 7) * 100, 100);

    // Weighted formula: 40% quiz, 35% mock, 15% mastery, 10% consistency
    let predicted;
    if (mockAvg !== null) {
      predicted =
        quizAvg * 0.4 +
        mockAvg * 0.35 +
        masteryRate * 0.15 +
        consistencyScore * 0.1;
    } else {
      predicted = quizAvg * 0.5 + masteryRate * 0.35 + consistencyScore * 0.15;
    }
    predicted = Math.round(Math.min(predicted, 100));

    // 6. Generate improvement insights
    const insights = [];
    if (masteryRate < 50) {
      insights.push(
        "Focus on mastering more topics — currently below 50% mastery rate.",
      );
    }
    if (consistencyScore < 50) {
      insights.push(
        "Study more consistently — aim for at least 5 active days per week.",
      );
    }
    if (quizAvg < 70) {
      insights.push(
        "Your quiz average is below 70 — review weak concepts and retry quizzes.",
      );
    }
    if (mockScores.length === 0) {
      insights.push("Take a mock exam to improve prediction accuracy.");
    }
    if (predicted >= 80) {
      insights.push("Great progress! Keep maintaining your current routine.");
    }

    // 7. Save/update the prediction
    await pool.execute(
      `INSERT INTO predicted_scores (user_id, subject_id, predicted_score)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE predicted_score = ?, updated_at = NOW()`,
      [userId, subjectId, predicted, predicted],
    );

    res.json({
      subjectId,
      predictedScore: predicted,
      breakdown: {
        quizAverage: Math.round(quizAvg),
        mockAverage: mockAvg !== null ? Math.round(mockAvg) : null,
        masteryRate: Math.round(masteryRate),
        consistencyScore: Math.round(consistencyScore),
        activeDaysThisWeek: consistency.active_days,
        totalTopics: masteryStats.total_topics,
        masteredTopics: masteryStats.mastered,
      },
      insights,
      mockExamHistory: mockScores,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/prediction — all subject predictions for user
exports.getAllPredictions = async (req, res) => {
  const userId = req.user.userId;

  try {
    const [predictions] = await pool.execute(
      `SELECT ps.*, s.name AS subject_name
       FROM predicted_scores ps
       JOIN subjects s ON ps.subject_id = s.id
       WHERE ps.user_id = ?
       ORDER BY ps.updated_at DESC`,
      [userId],
    );
    res.json(predictions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
