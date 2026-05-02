const pool = require("../config/db");
const { generateQuizAI } = require("../services/aiService");
const { rephraseQuestionsAI } = require("../services/aiService");

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
      "SELECT * FROM questions WHERE quiz_id = ?",
      [quizId],
    );

    for (let q of questions) {
      const [options] = await pool.execute(
        "SELECT id, option_text FROM question_options WHERE question_id = ?",
        [q.id],
      );
      q.options = options;
    }

    res.json({ questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.submitQuiz = async (req, res) => {
  const userId = req.user.userId;
  const { quizId } = req.params;
  const { answers } = req.body;
  // [{questionId, selectedOptionId}]

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Create attempt
    const [attemptRes] = await connection.execute(
      "INSERT INTO quiz_attempts (user_id, quiz_id) VALUES (?, ?)",
      [userId, quizId],
    );

    const attemptId = attemptRes.insertId;

    let correctCount = 0;

    for (let ans of answers) {
      const [[correctOption]] = await connection.execute(
        "SELECT id FROM question_options WHERE question_id = ? AND is_correct = 1",
        [ans.questionId],
      );

      const isCorrect = correctOption.id === ans.selectedOptionId;

      if (isCorrect) correctCount++;

      await connection.execute(
        `INSERT INTO answers 
        (attempt_id, question_id, selected_option_id, is_correct, mistake_reason, concept_tag) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          attemptId,
          ans.questionId,
          ans.selectedOptionId,
          isCorrect,
          isCorrect ? null : "Concept misunderstanding",
          "general",
        ],
      );
    }

    const score = Math.round((correctCount / answers.length) * 100);

    // Check mastery
    const passed = score >= 96;

    await connection.execute(
      "UPDATE quiz_attempts SET score = ?, passed = ?, finished_at = NOW() WHERE id = ?",
      [score, passed, attemptId],
    );

    await connection.commit();

    res.json({
      score,
      passed,
      nextStep: passed ? "MASTERED" : "RETRY",
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
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
  const userId = req.user.userId;

  try {
    const [attempts] = await pool.execute(
      "SELECT * FROM quiz_attempts WHERE quiz_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1",
      [quizId, userId],
    );

    if (attempts.length === 0) {
      return res.status(404).json({ error: "No attempt found" });
    }

    const attempt = attempts[0];

    const [mistakes] = await pool.execute(
      "SELECT question_id, mistake_reason FROM answers WHERE attempt_id = ? AND is_correct = 0",
      [attempt.id],
    );

    res.json({
      score: attempt.score,
      passed: attempt.passed,
      mistakes,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
