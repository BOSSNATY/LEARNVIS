const pool = require("../config/db");
const {
  generateQuizAI,
  rephraseQuestionsAI,
} = require("../services/aiService");
const { updateMistakeProfile } = require("../services/mistakeProfileService");
const { generateMicroLessons } = require("../services/microLessonService");
const { updateStudyPlanFromMistakes } = require("../services/studyPlanUpdater");

const activePromises = {};

const fallbackQuestions = (topic, difficulty, count) =>
  Array.from({ length: count }).map((_, index) => ({
    question: `${topic} ${difficulty} question ${index + 1}: choose the best answer.`,
    cognitive_category: ["conceptual", "application", "calculation"][index % 3],
    options: [
      { text: "Correct concept and reasoning", is_correct: true },
      { text: "Partially related idea", is_correct: false },
      { text: "Common misconception", is_correct: false },
      { text: "Unrelated answer", is_correct: false },
    ],
  }));

// POST /api/quiz/generate
exports.generateQuiz = async (req, res) => {
  const { topicId, mode } = req.body;
  if (!topicId) return res.status(400).json({ error: "topicId is required" });

  const difficulty = mode === "exam" ? "hard" : "medium";
  const count = mode === "mandatory" || mode === "exam" ? 20 : 10;
  const promiseKey = `${topicId}-${mode}`;

  // If there is already an active promise for this topic and mode, wait for it!
  if (activePromises[promiseKey]) {
    try {
      const cachedResult = await activePromises[promiseKey];
      return res.json(cachedResult);
    } catch (err) {
      // If it failed, let it fall through and try generating again
    }
  }

  // Create the promise for the execution
  const generationPromise = (async () => {
    const [[topic]] = await pool.execute(
      "SELECT id, title FROM topics WHERE id = ?",
      [topicId],
    );
    if (!topic) throw new Error("Topic not found");

    // 🛑 Prevent duplicate generation within a short window (5s)
    const [recent] = await pool.execute(
      `SELECT id FROM quizzes 
       WHERE topic_id = ? AND difficulty = ? AND created_at >= NOW() - INTERVAL 5 SECOND
       ORDER BY id DESC LIMIT 1`,
      [topicId, difficulty],
    );

    if (recent.length > 0) {
      return {
        quizId: recent[0].id,
        id: recent[0].id,
        topicId,
        difficulty,
        questionCount: count,
        timeLimitSeconds: count * 60,
      };
    }

    let questions;
    try {
      questions = await generateQuizAI({
        topic: topic.title,
        difficulty,
        count,
      });
    } catch (error) {
      console.error("AI quiz failed, using fallback:", error.message);
      questions = fallbackQuestions(topic.title, difficulty, count);
    }

    if (!Array.isArray(questions) || !questions.length) {
      questions = fallbackQuestions(topic.title, difficulty, count);
    }

    const [quizRes] = await pool.execute(
      "INSERT INTO quizzes (topic_id, difficulty) VALUES (?, ?)",
      [topicId, difficulty],
    );
    const quizId = quizRes.insertId;

    for (const q of questions) {
      const [qRes] = await pool.execute(
        "INSERT INTO questions (quiz_id, question_text, cognitive_category) VALUES (?, ?, ?)",
        [quizId, q.question, q.cognitive_category || "conceptual"],
      );
      const shuffledOptions = [...(q.options || [])].sort(
        () => Math.random() - 0.5,
      );
      for (const opt of shuffledOptions) {
        await pool.execute(
          "INSERT INTO question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)",
          [qRes.insertId, opt.text || opt.option_text, opt.is_correct ? 1 : 0],
        );
      }
    }

    return {
      quizId,
      id: quizId,
      topicId,
      difficulty,
      questionCount: questions.length,
      timeLimitSeconds: questions.timeLimitSeconds || count * 60,
      questions: questions,
    };
  })();

  activePromises[promiseKey] = generationPromise;

  try {
    const result = await generationPromise;
    return res.json(result);
  } catch (err) {
    if (err.message === "Topic not found") {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  } finally {
    delete activePromises[promiseKey];
  }
};

exports.getQuizzesByTopic = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM quizzes WHERE topic_id = ? ORDER BY id DESC",
      [req.params.topicId],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getQuiz = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT q.id AS question_id, q.question_text, q.cognitive_category,
              o.id AS option_id, o.option_text, o.is_correct
       FROM questions q
       JOIN question_options o ON q.id = o.question_id
       WHERE q.quiz_id = ?
       ORDER BY q.id, o.id`,
      [req.params.quizId],
    );
    if (!rows.length) return res.status(404).json({ error: "Quiz not found" });

    const questionsMap = {};
    for (const row of rows) {
      if (!questionsMap[row.question_id]) {
        questionsMap[row.question_id] = {
          id: row.question_id,
          question_id: row.question_id,
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

exports.startAttempt = async (req, res) => {
  const userId = req.user.id;
  try {
    const [[quiz]] = await pool.execute("SELECT id FROM quizzes WHERE id = ?", [
      req.params.quizId,
    ]);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    // 🛑 Prevent duplicate attempts starting from duplicate frontend requests
    const [existingAttempts] = await pool.execute(
      "SELECT id, round_number FROM quiz_attempts WHERE user_id = ? AND quiz_id = ? AND completed_at IS NULL ORDER BY id DESC LIMIT 1",
      [userId, req.params.quizId],
    );

    if (existingAttempts.length > 0) {
      return res.json({
        attemptId: existingAttempts[0].id,
        round: existingAttempts[0].round_number,
      });
    }

    const [countRes] = await pool.execute(
      "SELECT COUNT(*) AS count FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?",
      [userId, req.params.quizId],
    );
    const roundNumber = countRes[0].count + 1;
    const [result] = await pool.execute(
      "INSERT INTO quiz_attempts (user_id, quiz_id, round_number, score, passed) VALUES (?, ?, ?, 0, 0)",
      [userId, req.params.quizId, roundNumber],
    );
    res.json({ attemptId: result.insertId, round: roundNumber });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.submitQuiz = async (req, res) => {
  const userId = req.user.id;
  const { attemptId, answers, topicId, planId } = req.body;
  if (!attemptId || !Array.isArray(answers))
    return res
      .status(400)
      .json({ error: "attemptId and answers[] are required" });

  try {
    const questionIds = answers.map((a) => a.questionId);
    if (!questionIds.length)
      return res.status(400).json({ error: "No answers provided" });
    const [correctRows] = await pool.query(
      `SELECT question_id, option_text FROM question_options WHERE question_id IN (?) AND is_correct = 1`,
      [questionIds],
    );
    const correctMap = {};
    for (const row of correctRows)
      correctMap[row.question_id] = row.option_text;

    let correctCount = 0;
    for (const a of answers) {
      const correctAnswer = correctMap[a.questionId] || "Unknown";
      const userSelected = a.selectedOption || "No Answer";
      const isCorrect = userSelected === correctAnswer;
      if (isCorrect) correctCount++;

      await pool.execute(
        `INSERT INTO quiz_answers (attempt_id, question_id, selected_option, is_correct, concept_tag)
         VALUES (?, ?, ?, ?, ?)`,
        [
          attemptId,
          a.questionId,
          userSelected,
          isCorrect ? 1 : 0,
          a.conceptTag || "general",
        ],
      );

      if (!isCorrect) {
        await pool.execute(
          `INSERT INTO mistakes (user_id, topic_id, question_id, user_answer, correct_answer)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE user_answer = VALUES(user_answer), correct_answer = VALUES(correct_answer)`,
          [userId, topicId, a.questionId, userSelected, correctAnswer],
        );
        await updateMistakeProfile(userId, topicId, a.conceptTag || "general");
      }
    }

    const score = Math.round((correctCount / answers.length) * 100);
    const passed = score >= 96 ? 1 : 0;
    await pool.execute(
      "UPDATE quiz_attempts SET score = ?, passed = ?, completed_at = NOW() WHERE id = ?",
      [score, passed, attemptId],
    );

    const [[quizRow]] = await pool.execute(
      "SELECT topic_id FROM quizzes WHERE id = ?",
      [req.params.quizId],
    );
    if (quizRow) {
      const status = score >= 96 ? "mastered" : "practicing";

      // Fetch subject_id to ensure we can create a record if it doesn't exist
      const [[topicRow]] = await pool.execute(
        "SELECT subject_id FROM topics WHERE id = ?",
        [quizRow.topic_id],
      );
      const subjectId = topicRow?.subject_id || null;

      await pool.execute(
        `INSERT INTO learning_state (user_id, subject_id, topic_id, mastery_score, status, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE mastery_score = VALUES(mastery_score), status = VALUES(status), updated_at = NOW()`,
        [userId, subjectId, quizRow.topic_id, score, status],
      );
    }
    if (topicId)
      await generateMicroLessons(userId, topicId).catch((e) =>
        console.error("Micro-lesson generation failed:", e.message),
      );
    if (planId)
      await updateStudyPlanFromMistakes(planId, userId).catch((e) =>
        console.error("Plan updater failed:", e.message),
      );

    res.json({
      message: "Quiz submitted successfully",
      score,
      passed: Boolean(passed),
      correct: correctCount,
      total: answers.length,
      mastered: score >= 96,
    });
  } catch (err) {
    console.log("Error in  submitQuiz:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getResult = async (req, res) => {
  try {
    const [attempts] = await pool.execute(
      `SELECT qa.*, COUNT(qan.id) AS total_questions, SUM(qan.is_correct) AS correct_count
       FROM quiz_attempts qa
       LEFT JOIN quiz_answers qan ON qan.attempt_id = qa.id
       WHERE qa.quiz_id = ? AND qa.user_id = ?
       GROUP BY qa.id
       ORDER BY qa.round_number DESC LIMIT 1`,
      [req.params.quizId, req.user.id],
    );
    if (!attempts.length)
      return res.status(404).json({ error: "No result found" });
    res.json(attempts[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAttempts = async (req, res) => {
  try {
    const [attempts] = await pool.execute(
      "SELECT * FROM quiz_attempts WHERE quiz_id = ? AND user_id = ? ORDER BY round_number DESC",
      [req.params.quizId, req.user.id],
    );
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMasteryStatus = async (req, res) => {
  try {
    const [[quiz]] = await pool.execute(
      "SELECT topic_id FROM quizzes WHERE id = ?",
      [req.params.quizId],
    );
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    const [[state]] = await pool.execute(
      "SELECT * FROM learning_state WHERE user_id = ? AND topic_id = ?",
      [req.user.id, quiz.topic_id],
    );
    res.json(
      state || {
        topic_id: quiz.topic_id,
        status: "not_started",
        mastery_score: 0,
      },
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.generateRemasteredQuiz = async (req, res) => {
  try {
    const [wrongRows] = await pool.execute(
      `SELECT q.question_text, qo.option_text, qo.is_correct
       FROM quiz_attempts qa
       JOIN quiz_answers ans ON ans.attempt_id = qa.id
       JOIN questions q ON q.id = ans.question_id
       JOIN question_options qo ON qo.question_id = q.id
       WHERE qa.quiz_id = ? AND ans.is_correct = 0`,
      [req.params.quizId],
    );

    const questions = wrongRows.length
      ? await rephraseQuestionsAI(wrongRows).catch(() => [])
      : [];

    // 🔀 Shuffle rephrased options as well
    questions.forEach((q) => {
      if (Array.isArray(q.options)) {
        q.options.sort(() => Math.random() - 0.5);
      }
    });

    res.json({ quizId: req.params.quizId, questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
