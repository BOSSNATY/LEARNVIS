const pool = require("../config/db");

exports.getDashboard = async (req, res) => {
  const userId = req.user.userId;

  try {
    // 1. USER SUBJECTS
    const [userSubjects] = await pool.execute(
      `SELECT s.id, s.name
       FROM user_subjects us
       JOIN subjects s ON us.subject_id = s.id
       WHERE us.user_id = ?`,
      [userId],
    );

    const subjectsCount = userSubjects.length;

    // 2. QUIZ STATS (🔥 FIXED)
    const [quizStats] = await pool.execute(
      `SELECT 
          COUNT(*) as totalQuizzes,
          AVG(score) as avgScore
       FROM quiz_attempts
       WHERE user_id = ? AND finished_at IS NOT NULL`,
      [userId],
    );

    const quizzesCompleted = quizStats[0]?.totalQuizzes || 0;
    const averageScore = Math.round(quizStats[0]?.avgScore || 0);

    // 3. RECENT ACTIVITY (🔥 FIXED)
    const [recentActivity] = await pool.execute(
      `
      SELECT 
          'quiz' as type,
          score,
          CONCAT('Quiz attempt') as title,
          finished_at as date
      FROM quiz_attempts
      WHERE user_id = ? AND finished_at IS NOT NULL

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

    // 4. STREAK (based on study_sessions)
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

    // 5. WEEKLY GOAL (🔥 FIXED)
    const [weekly] = await pool.execute(
      `SELECT COUNT(*) as completed
       FROM quiz_attempts
       WHERE user_id = ?
       AND finished_at IS NOT NULL
       AND finished_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
      [userId],
    );

    const weeklyGoal = {
      completed: weekly[0]?.completed || 0,
      target: 5,
    };

    // 6. SUGGESTED SUBJECTS
    const [allSubjects] = await pool.execute(
      `SELECT id, name FROM subjects LIMIT 6`,
    );

    const userSubjectIds = userSubjects.map((s) => s.id);

    const suggestedSubjects = allSubjects.filter(
      (s) => !userSubjectIds.includes(s.id),
    );

    // 🔥 CHECK IF USER HAS TOPICS
    const [userTopics] = await pool.execute(
      `SELECT t.id
   FROM user_subjects us
   JOIN topics t ON t.subject_id = us.subject_id
   WHERE us.user_id = ?
   LIMIT 1`,
      [userId],
    );

    const hasTopics = userTopics.length > 0;
    // FINAL RESPONSE
    res.json({
      subjects: userSubjects,
      subjectsCount,
      quizzesCompleted,
      averageScore,
      streak,
      recentActivity: recentActivity || [],
      weeklyGoal,
      suggestedSubjects,
      hasTopics,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: err.message });
  }
};
