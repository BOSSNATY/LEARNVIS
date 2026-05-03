const pool = require("../config/db");
const { generateQuizAI, rephraseQuestionsAI } = require("../services/aiService");
const { updateMistakeProfile } = require("../services/mistakeProfileService");
const { generateMicroLessons } = require("../services/microLessonService");
const { updateStudyPlanFromMistakes } = require("../services/studyPlanUpdater");

// POST /api/quiz/generate
exports.generateQuiz = async (req, res) => {
  const { topicId, mode } = req.body;

  if (!topicId) {
    return res.status(400).json({ error: "topicId is required" });
  }

  try {
    const [[topic]] = await pool.execute(
      "SELECT id, title FROM topics WHERE id = ?",
      [topicId]
    );
    if (!topic) return res.status(404).json({ error: "Topic not found" });

    const difficulty = mode === "exam" ? "hard" : "medium";
    const count = mode === "exam" ? 20 : 10;

    const questions = await generateQuizAI({ topic: topic.title, difficulty, count });

    const [quizRes] = await pool.execute(
      "INSERT INTO quizzes (topic_id, difficulty) VALUES (?, ?)",
      [topicId, difficulty]
    );
    const quizId = quizRes.insertId;

    for (const q of questions) {
      const [qRes] = await pool.execute(
        "INSERT INTO questions (quiz_id, question_text, cognitive_category) VALUES (?, ?, ?)",
        [quizId, q.question, q.cognitive_category || "conceptual"]
      );
      const questionId = qRes.insertId;

      for (const opt of q.options) {
        await pool.execute(
          "INSERT INTO question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)",
          [questionId, opt.text, opt.is_correct ? 1 : 0]
        );
      }
    }

    res.json({ quizId, topicId, difficulty, questionCount: questions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/quiz/:quizId
exports.getQuiz = async (req, res) => {
  const { quizId } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT q.id AS question_id, q.question_text, q.cognitive_category,
              o.id AS option_id, o.option_text, o.is_correct
       FROM questions q
       JOIN question_options o ON q.id = o.question_id
       WHERE q.quiz_id = ?
       ORDER BY q.id, o.id`,
      [quizId]
    );

    if (!rows.length) return res.status(404).json({ error: "Quiz not found" });

    // Group options under each question
    const questionsMap = {};
    for (const row of rows) {
      if (!questionsMap[row.question_id]) {
        questionsMap[row.question_id] = {
          id: row.question_id,
          question_text: row.question_text,
          cognitive_category: row.cognitive_category,
          options: [],
        };
      }
      questionsMap[row.question_id].options.push({
        id: row.option_id,
        option_text: row.option_text,
        is_correct: row.is_correct,
      });
    }

    res.json(Object.values(questionsMap));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/quiz/:quizId/attempt — start an attempt
exports.startAttempt = async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;

  try {
    const [[quiz]] = await pool.execute("SELECT id FROM quizzes WHERE id = ?", [quizId]);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const [countRes] = await pool.execute(
      "SELECT COUNT(*) AS count FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?",
      [userId, quizId]
    );
    const roundNumber = countRes[0].count + 1;

    const [result] = await pool.execute(
      "INSERT INTO quiz_attempts (user_id, quiz_id, round_number, score, passed) VALUES (?, ?, ?, 0, 0)",
      [userId, quizId, roundNumber]
    );

    res.json({ attemptId: result.insertId, round: roundNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/quiz/:quizId/submit
exports.submitQuiz = async (req, res) => {
  const userId = req.user.id;
  const { quizId } = req.params;
  const { attemptId, answers, topicId, planId } = req.body;

  if (!attemptId || !Array.isArray(answers)) {
    return res.status(400).json({ error: "attemptId and answers[] are required" });
  }

  try {
    // 1. Fetch correct answers from DB
    const questionIds = answers.map((a) => a.questionId);
    if (!questionIds.length) {
      return res.status(400).json({ error: "No answers provided" });
    }

    const [correctRows] = await pool.query(
      `SELECT question_id, option_text FROM question_options
       WHERE question_id IN (?) AND is_correct = 1`,
      [questionIds]
    );
    const correctMap = {};
    for (const row of correctRows) {
      correctMap[row.question_id] = row.option_text;
    }

    // 2. Score the attempt
    let correctCount = 0;
    const totalCount = answers.length;

    for (const a of answers) {
      const correctAnswer = correctMap[a.questionId];
      const isCorrect = a.selectedOption === correctAnswer;
      if (isCorrect) correctCount++;

      // Record each answer
      await pool.execute(
        `INSERT INTO quiz_answers (attempt_id, question_id, selected_option, is_correct, concept_tag)
         VALUES (?, ?, ?, ?, ?)`,
        [attemptId, a.questionId, a.selectedOption, isCorrect ? 1 : 0, a.conceptTag || "general"]
      );

      // Record mistakes
      if (!isCorrect) {
        await pool.execute(
          `INSERT INTO mistakes (user_id, topic_id, question_id, user_answer, correct_answer)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE correct_answer = VALUES(correct_answer)`,
          [userId, topicId, a.questionId, a.selectedOption, correctAnswer]
        );

        await updateMistakeProfile(userId, topicId, a.conceptTag || "general");
      }
    }

    const score = Math.round((correctCount / totalCount) * 100);
    const passed = score >= 96 ? 1 : 0;

    // 3. Update attempt record with final score
    await pool.execute(
      "UPDATE quiz_attempts SET score = ?, passed = ?, completed_at = NOW() WHERE id = ?",
      [score, passed, attemptId]
    );

    // 4. Update learning state
    const [[quizRow]] = await pool.execute("SELECT topic_id FROM quizzes WHERE id = ?", [quizId]);
    if (quizRow) {
      const status = score >= 96 ? "mastered" : "practicing";
      await pool.execute(
        `UPDATE learning_state SET mastery_score = ?, status = ?, updated_at = NOW()
         WHERE user_id = ? AND topic_id = ?`,
        [score, status, userId, quizRow.topic_id]
      );
    }

    // 5. Generate micro-lessons for wrong answers
    if (topicId) {
      await generateMicroLessons(userId, topicId).catch((e) =>
        console.error("Micro-lesson generation failed:", e.message)
      );
    }

    // 6. Adapt study plan if planId provided
    if (planId) {
      await updateStudyPlanFromMistakes(planId, userId).catch((e) =>
        console.error("Plan updater failed:", e.message)
      );
    }

    res.json({
      message: "Quiz submitted successfully",
      score,
      passed: Boolean(passed),
      correct: correctCount,
      total: totalCount,
      mastered: score >= 96,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/quiz/:quizId/result
exports.getResult = async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;

  try {
    const [attempts] = await pool.execute(
      `SELECT qa.*, 
              COUNT(qan.id) AS total_questions,
              SUM(qan.is_correct) AS correct_count
       FROM quiz_attempts qa
       LEFT JOIN quiz_answers qan ON qan.attempt_id = qa.id
       WHERE qa.quiz_id = ? AND qa.user_id = ?
       ORDER BY qa.round_number DESC LIMIT 1`,
      [quizId, userId]
    );

    if (!attempts.length) return res.status(404).json({ error: "No result found" });

    res.json(attempts[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/quiz/:quizId/attempts
exports.getAttempts = async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;

  try {
    const [attempts] = await pool.execute(
      `SELECT * FROM quiz_attempts WHERE quiz_id = ? AND user_id = ? ORDER BY round_number ASC`,
      [quizId, userId]
    );
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/quiz/:quizId/mastery
exports.getMasteryStatus = async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;

  try {
    const [[result]] = await pool.execute(
      `SELECT MAX(score) AS bestScore, COUNT(*) AS totalAttempts
       FROM quiz_attempts WHERE quiz_id = ? AND user_id = ?`,
      [quizId, userId]
    );

    const bestScore = result.bestScore || 0;
    res.json({
      mastered: bestScore >= 96,
      score: bestScore,
      totalAttempts: result.totalAttempts,
      remaining: Math.max(0, 96 - bestScore),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/quiz/:quizId/remaster — AI rephrases wrong questions into a new quiz
exports.generateRemasteredQuiz = async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;

  try {
    // 1. Get last attempt's wrong questions
    const [wrongQuestions] = await pool.execute(
      `SELECT DISTINCT q.id, q.question_text, q.cognitive_category
       FROM quiz_answers qa
       JOIN quiz_attempts att ON qa.attempt_id = att.id
       JOIN questions q ON qa.question_id = q.id
       WHERE att.quiz_id = ? AND att.user_id = ? AND qa.is_correct = 0
       ORDER BY att.round_number DESC`,
      [quizId, userId]
    );

    if (!wrongQuestions.length) {
      return res.json({ message: "No wrong answers to remaster — you got everything right!" });
    }

    // 2. Get original quiz topic
    const [[quiz]] = await pool.execute(
      `SELECT q.id, q.topic_id, t.title AS topic_title
       FROM quizzes q JOIN topics t ON q.topic_id = t.id
       WHERE q.id = ?`,
      [quizId]
    );
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    // 3. AI rephrases the wrong questions
    const rephrased = await rephraseQuestionsAI(wrongQuestions);

    // 4. Save as a new quiz linked to the same topic
    const [newQuizRes] = await pool.execute(
      "INSERT INTO quizzes (topic_id, difficulty, parent_quiz_id) VALUES (?, 'medium', ?)",
      [quiz.topic_id, quizId]
    );
    const newQuizId = newQuizRes.insertId;

    for (const q of rephrased) {
      const [qRes] = await pool.execute(
        "INSERT INTO questions (quiz_id, question_text, cognitive_category) VALUES (?, ?, ?)",
        [newQuizId, q.question, q.cognitive_category || "conceptual"]
      );
      const questionId = qRes.insertId;

      for (const opt of q.options) {
        await pool.execute(
          "INSERT INTO question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)",
          [questionId, opt.text, opt.is_correct ? 1 : 0]
        );
      }
    }

    res.json({
      message: "Remastered quiz created",
      newQuizId,
      basedOnWrongCount: wrongQuestions.length,
      topic: quiz.topic_title,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/quiz/topic/:topicId — get all quizzes for a topic
exports.getQuizzesByTopic = async (req, res) => {
  const { topicId } = req.params;
  const userId = req.user.id;

  try {
    const [quizzes] = await pool.execute(
      `SELECT q.id, q.difficulty, q.created_at,
              MAX(qa.score) AS best_score,
              MAX(qa.passed) AS passed,
              COUNT(DISTINCT qa.id) AS attempt_count
       FROM quizzes q
       LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.user_id = ?
       WHERE q.topic_id = ? AND q.parent_quiz_id IS NULL
       GROUP BY q.id
       ORDER BY q.created_at DESC`,
      [userId, topicId]
    );
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
