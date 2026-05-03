const express = require("express");
const router = express.Router();
const quizController = require("../controllers/quizController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/generate", authMiddleware, quizController.generateQuiz);
router.get("/topic/:topicId", authMiddleware, quizController.getQuizzesByTopic);
router.get("/:quizId", authMiddleware, quizController.getQuiz);
router.post("/:quizId/attempt", authMiddleware, quizController.startAttempt);
router.post("/:quizId/submit", authMiddleware, quizController.submitQuiz);
router.get("/:quizId/result", authMiddleware, quizController.getResult);
router.get("/:quizId/attempts", authMiddleware, quizController.getAttempts);
router.get("/:quizId/mastery", authMiddleware, quizController.getMasteryStatus);
router.post(
  "/:quizId/remaster",
  authMiddleware,
  quizController.generateRemasteredQuiz,
);

module.exports = router;
