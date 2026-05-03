const pool = require("../config/db");
const { generateQuizAI } = require("../services/aiService");

// POST /api/mock/generate
exports.generateMockExam = async (req, res) => {
  const userId = req.user.userId;
  const { subjectId, durationMinutes } = req.body;

  if (!subjectId) return res.status(400).json({ error: "subjectId is required" });

  try {
    // 1. Get all mastered or practiced topics for this subject
    const [topics] = await pool.execute(
      `SELECT t.id, t.title
       FROM topics t
       LEFT JOIN learning_state ls ON ls.topic_id = t.id AND ls.user_id = ?
       WHERE t.subject_id = ? AND (ls.status IN ('practicing', 'mastered') OR ls.status IS NOT NULL)
       LIMIT 10`,
      [userId, subjectId]
    );

    if (!topics.length) {
      return res.status(400).json({
        error: "You need to study at least some topics before taking a mock exam",
      });
    }

    // 2. Create the mock exam record
    const duration = durationMinutes || 60;
    const [examRes] = await pool.execute(
      "INSERT INTO mock_exams (user_id, subject_id, duration_minutes) VALUES (?, ?, ?)",
      [userId, subjectId, duration]
    );
    const examId = examRes.insertId;

    // 3. Generate hard questions for each topic (2–3 per topic)
    const allQuestions = [];
    for (const topic of topics) {
      const questions = await generateQuizAI({ topic: topic.title, difficulty: "hard", count: 3 });
      for (const q of questions) {
        const [qRes] = await pool.execute(
          "INSERT INTO mock_questions (exam_id, topic_id, question_text, cognitive_category) VALUES (?, ?, ?, ?)",
          [examId, topic.id, q.question, q.cognitive_category || "reasoning"]
        );
        const questionId = qRes.insertId;

        for (const opt of q.options) {
          await pool.execute(
            "INSERT INTO mock_options (question_id, option_text, is_correct) VALUES (?, ?, ?)",
            [questionId, opt.text, opt.is_correct ? 1 : 0]
          );
        }

        allQuestions.push({ id: questionId, question: q.question });
      }
    }

    res.status(201).json({
      examId,
      subjectId,
      durationMinutes: duration,
      questionCount: allQuestions.length,
      topicsCovered: topics.map((t) => t.title),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/mock/:examId — fetch exam questions
exports.getMockExam = async (req, res) => {
  const { examId } = req.params;
  const userId = req.user.userId;

  try {
    const [[exam]] = await pool.execute(
      "SELECT * FROM mock_exams WHERE id = ? AND user_id = ?",
      [examId, userId]
    );
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    const [rows] = await pool.execute(
      `SELECT mq.id AS question_id, mq.question_text, mq.cognitive_category,
              mo.id AS option_id, mo.option_text, mo.is_correct,
              t.title AS topic
       FROM mock_questions mq
       JOIN mock_options mo ON mo.question_id = mq.id
       JOIN topics t ON mq.topic_id = t.id
       WHERE mq.exam_id = ?
       ORDER BY mq.id, mo.id`,
      [examId]
    );

    const questionsMap = {};
    for (const row of rows) {
      if (!questionsMap[row.question_id]) {
        questionsMap[row.question_id] = {
          id: row.question_id,
          question_text: row.question_text,
          cognitive_category: row.cognitive_category,
          topic: row.topic,
          options: [],
        };
      }
      questionsMap[row.question_id].options.push({
        id: row.option_id,
        option_text: row.option_text,
        is_correct: row.is_correct,
      });
    }

    res.json({
      examId,
      durationMinutes: exam.duration_minutes,
      questions: Object.values(questionsMap),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/mock/:examId/submit
exports.submitMockExam = async (req, res) => {
  const { examId } = req.params;
  const userId = req.user.userId;
  const { answers } = req.body; // [{ questionId, selectedOption }]

  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: "answers[] is required" });
  }

  try {
    const [[exam]] = await pool.execute(
      "SELECT * FROM mock_exams WHERE id = ? AND user_id = ?",
      [examId, userId]
    );
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    // Score answers
    let correct = 0;
    const breakdown = [];

    for (const a of answers) {
      const [[correctOpt]] = await pool.execute(
        "SELECT option_text FROM mock_options WHERE question_id = ? AND is_correct = 1",
        [a.questionId]
      );
      const isCorrect = correctOpt && a.selectedOption === correctOpt.option_text;
      if (isCorrect) correct++;
      breakdown.push({ questionId: a.questionId, isCorrect, correctAnswer: correctOpt?.option_text });
    }

    const score = answers.length ? Math.round((correct / answers.length) * 100) : 0;

    // Save result
    await pool.execute(
      `UPDATE mock_exams SET score = ?, submitted_at = NOW() WHERE id = ?`,
      [score, examId]
    );

    // Update predicted score for this subject
    await pool.execute(
      `INSERT INTO predicted_scores (user_id, subject_id, predicted_score)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE predicted_score = ?, updated_at = NOW()`,
      [userId, exam.subject_id, score, score]
    );

    res.json({
      examId,
      score,
      correct,
      total: answers.length,
      passed: score >= 50,
      breakdown,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/mock/:examId/result
exports.getMockResult = async (req, res) => {
  const { examId } = req.params;
  const userId = req.user.userId;

  try {
    const [[exam]] = await pool.execute(
      `SELECT me.*, s.name AS subject_name
       FROM mock_exams me
       LEFT JOIN subjects s ON me.subject_id = s.id
       WHERE me.id = ? AND me.user_id = ?`,
      [examId, userId]
    );
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/mock — list all mock exams for user
exports.getMyMockExams = async (req, res) => {
  const userId = req.user.userId;

  try {
    const [exams] = await pool.execute(
      `SELECT me.id, me.duration_minutes, me.score, me.created_at, me.submitted_at,
              s.name AS subject_name
       FROM mock_exams me
       LEFT JOIN subjects s ON me.subject_id = s.id
       WHERE me.user_id = ?
       ORDER BY me.created_at DESC`,
      [userId]
    );
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
