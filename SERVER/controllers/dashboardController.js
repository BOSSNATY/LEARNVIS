const pool = require("../config/db");

exports.getDashboard = async (req, res) => {
  const userId = req.user.userId;

  try {
    // 1. Subjects count
    const [subjects] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM user_subjects 
       WHERE user_id = ?`,
      [userId],
    );

    const subjectsCount = subjects[0]?.count || 0;

    // 2. Quiz stats (FIXED with JOIN)
    const [quizStats] = await pool.execute(
      `SELECT 
          COUNT(qr.id) as totalQuizzes,
          AVG(qr.score) as avgScore
       FROM quiz_result qr
       JOIN quiz_attempts qa ON qr.attempt_id = qa.id
       WHERE qa.user_id = ?`,
      [userId],
    );

    const quizzesCompleted = quizStats[0]?.totalQuizzes || 0;
    const averageScore = Math.round(quizStats[0]?.avgScore || 0);

    // 3. Recent activity (quiz + study sessions)
    const [recentActivity] = await pool.execute(
      `
      SELECT 
          'quiz' as type,
          qr.score as score,
          qr.recommendation as title,
          qa.created_at as date
      FROM quiz_result qr
      JOIN quiz_attempts qa ON qr.attempt_id = qa.id
      WHERE qa.user_id = ?

      UNION ALL

      SELECT 
          'learn' as type,
          NULL as score,
          CONCAT('Topic ', topic_id) as title,
          start_time as date
      FROM study_sessions
      WHERE user_id = ? AND end_time IS NOT NULL

      ORDER BY date DESC
      LIMIT 5
      `,
      [userId, userId],
    );

    // 4. Weak topics → recommendations
    const [weakTopics] = await pool.execute(
      `SELECT concept_tag, frequency
       FROM mistake_profiles
       WHERE user_id = ?
       ORDER BY frequency DESC
       LIMIT 3`,
      [userId],
    );

    const recommendedTopics = weakTopics.map((t) => ({
      subject: "AI Insight",
      topic: t.concept_tag,
      reason: "You struggle with this concept",
    }));

    // 5. Study streak
    const [activityDates] = await pool.execute(
      `SELECT DATE(start_time) as date
       FROM study_sessions
       WHERE user_id = ?
       GROUP BY DATE(start_time)
       ORDER BY date DESC`,
      [userId],
    );

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < activityDates.length; i++) {
      const diff = Math.floor(
        (today - new Date(activityDates[i].date)) / (1000 * 60 * 60 * 24),
      );

      if (diff === streak) streak++;
      else break;
    }

    // 6. Weekly goal
    const [weekly] = await pool.execute(
      `SELECT COUNT(qr.id) as completed
       FROM quiz_result qr
       JOIN quiz_attempts qa ON qr.attempt_id = qa.id
       WHERE qa.user_id = ?
       AND qa.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [userId],
    );

    const weeklyGoal = {
      completed: weekly[0]?.completed || 0,
      target: 5,
    };

    // 7. FINAL RESPONSE
    res.json({
      subjectsCount,
      quizzesCompleted,
      averageScore,
      streak,
      recentActivity: recentActivity || [],
      recommendedTopics,
      weeklyGoal,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: err.message });
  }
};
