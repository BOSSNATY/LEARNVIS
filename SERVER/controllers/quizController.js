const pool = require("../config/db");
const { generateQuizAI } = require("../services/aiService");
const { rephraseQuestionsAI } = require("../services/aiService");
const {
  handleMistakes,
  updateLearningState,
} = require("../services/quizService");

const { processMistakes } = require("../services/mistakeService");

const { updateMistakeProfile } = require("../services/mistakeProfileService");
const { generateMicroLessons } = require("../services/microLessonService");
const { updateStudyPlanFromMistakes } = require("../services/studyPlanUpdater");

exports.generateQuiz = async (req, res) => {
  const { topicId, mode } = req.body;

  try {
    // 1. Get topic name
    const [[topic]] = await pool.execute(
      "SELECT title FROM topics WHERE id = ?",
      [topicId],
    );

    if (!topic) return res.status(404).json({ error: "Topic not found" });

    // 2. Decide difficulty & count
    const difficulty = mode === "exam" ? "hard" : "medium";
    const count = mode === "exam" ? 20 : 10;

    // 3. AI generate questions
    const questions = await generateQuizAI({
      topic: topic.title,
      difficulty,
      count,
    });

    // 4. Save quiz
    const [quizRes] = await pool.execute(
      "INSERT INTO quizzes (topic_id) VALUES (?)",
      [topicId],
    );

    const quizId = quizRes.insertId;

    // 5. Save questions
    for (let q of questions) {
      const [qRes] = await pool.execute(
        "INSERT INTO questions (quiz_id, question_text, cognitive_category) VALUES (?, ?, ?)",
        [quizId, q.question, q.cognitive_category],
      );

      const questionId = qRes.insertId;

      for (let opt of q.options) {
        await pool.execute(
          "INSERT INTO question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)",
          [questionId, opt.text, opt.is_correct],
        );
      }
    }

    res.json({ quizId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getQuiz = async (req, res) => {
  const { quizId } = req.params;

  try {
    const [questions] = await pool.execute(
      `SELECT q.*, o.id as option_id, o.option_text, o.is_correct
       FROM questions q
       JOIN question_options o ON q.id = o.question_id
       WHERE q.quiz_id = ?`,
      [quizId],
    );

    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.submitQuiz = async (req, res) => {
  const userId = req.user.id;
  const { answers, topicId, planId } = req.body;

  try {
    for (const a of answers) {
      if (!a.isCorrect) {
        // 1. Save raw mistake
        await pool.execute(
          `
          INSERT INTO mistakes
          (user_id, topic_id, question_id, user_answer, correct_answer)
          VALUES (?, ?, ?, ?, ?)
          `,
          [userId, topicId, a.questionId, a.userAnswer, a.correctAnswer],
        );

        // 2. Update concept intelligence
        await updateMistakeProfile(userId, topicId, a.conceptTag || "general");
      }
    }

    // 3. Generate micro-lessons (AI)
    await generateMicroLessons(userId, topicId);

    // 4. Update study plan dynamically
    await updateStudyPlanFromMistakes(planId, userId);

    res.json({
      message: "Quiz processed successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.retryQuiz = async (req, res) => {
  const { attemptId } = req.params;

  try {
    // 1. Get wrong questions
    const [wrong] = await pool.execute(
      `SELECT q.id, q.question_text 
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       WHERE a.attempt_id = ? AND a.is_correct = 0`,
      [attemptId],
    );

    if (!wrong.length) {
      return res.json({ message: "Nothing to retry" });
    }

    // 2. AI rephrase
    const rephrased = await rephraseQuestionsAI(wrong);

    // 3. Create new quiz
    const [quizRes] = await pool.execute(
      "INSERT INTO quizzes (generated_by) VALUES ('ai')",
    );

    const quizId = quizRes.insertId;

    // 4. Save rephrased
    for (let q of rephrased) {
      const [qRes] = await pool.execute(
        "INSERT INTO questions (quiz_id, question_text, cognitive_category) VALUES (?, ?, 'conceptual')",
        [quizId, q.question],
      );

      const questionId = qRes.insertId;

      for (let opt of q.options) {
        await pool.execute(
          "INSERT INTO question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)",
          [questionId, opt.text, opt.is_correct],
        );
      }
    }

    res.json({ quizId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getResult = async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;

  try {
    const [result] = await pool.execute(
      `SELECT * FROM quiz_attempts 
       WHERE quiz_id = ? AND user_id = ?
       ORDER BY id DESC LIMIT 1`,
      [quizId, userId],
    );

    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.startAttempt = async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;

  try {
    // get attempt number
    const [attempts] = await pool.execute(
      "SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?",
      [userId, quizId],
    );

    const roundNumber = attempts[0].count + 1;

    const [result] = await pool.execute(
      `INSERT INTO quiz_attempts (user_id, quiz_id, round_number, score, passed)
       VALUES (?, ?, ?, 0, 0)`,
      [userId, quizId, roundNumber],
    );

    res.json({
      attemptId: result.insertId,
      round: roundNumber,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAttempts = async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;

  try {
    const [attempts] = await pool.execute(
      `SELECT * FROM quiz_attempts
       WHERE quiz_id = ? AND user_id = ?
       ORDER BY round_number ASC`,
      [quizId, userId],
    );

    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.generateRemasteredQuiz = async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;

  try {
    // 1. Get last attempt mistakes
    const [mistakes] = await pool.execute(
      `SELECT a.*, q.question_text, q.cognitive_category
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       JOIN quiz_attempts qa ON a.attempt_id = qa.id
       WHERE qa.quiz_id = ? AND qa.user_id = ? AND a.is_correct = 0`,
      [quizId, userId],
    );

    // 2. Get quiz topic
    const [quiz] = await pool.execute(
      `SELECT topic_id FROM quizzes WHERE id = ?`,
      [quizId],
    );

    const topicId = quiz[0]?.topic_id;

    if (!topicId) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // 3. HERE: AI generation placeholder (Gemini/OpenAI later)
    // For now, we simulate structure

    const remasteredQuiz = {
      topicId,
      basedOnMistakes: mistakes.map((m) => m.concept_tag),
      questions: mistakes.map((m, index) => ({
        question_text: `Rephrased version of: ${m.question_text}`,
        cognitive_category: m.cognitive_category,
        options: ["Option A", "Option B", "Option C", "Option D"],
      })),
    };

    res.json({
      message: "Remastered quiz generated",
      quiz: remasteredQuiz,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMasteryStatus = async (req, res) => {
  const { quizId } = req.params;
  const userId = req.user.id;

  try {
    const [result] = await pool.execute(
      `SELECT MAX(score) as bestScore
       FROM quiz_attempts
       WHERE quiz_id = ? AND user_id = ?`,
      [quizId, userId],
    );

    const bestScore = result[0].bestScore || 0;

    res.json({
      mastered: bestScore >= 96,
      score: bestScore,
      remaining: Math.max(0, 96 - bestScore),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
