const express = require("express");
const router = express.Router();
const mockExamController = require("../controllers/mockExamController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/", authMiddleware, mockExamController.getMyMockExams);
router.post("/generate", authMiddleware, mockExamController.generateMockExam);
router.get("/:examId", authMiddleware, mockExamController.getMockExam);
router.post("/:examId/submit", authMiddleware, mockExamController.submitMockExam);
router.get("/:examId/result", authMiddleware, mockExamController.getMockResult);

module.exports = router;
