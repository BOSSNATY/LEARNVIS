const express = require("express");
const router = express.Router();

const quizController = require("../controllers/quizController");

const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/generate", authMiddleware, quizController);

router.get("/:quizId", authMiddleware, quizController);

router.post("/:quizId/submit", authMiddleware, quizController);

module.exports = router;
