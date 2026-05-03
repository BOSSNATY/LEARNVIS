const express = require("express");
const router = express.Router();
const learningController = require("../controllers/learningController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/start", authMiddleware, learningController.startLearning);
router.get(
  "/content/:topicId",
  authMiddleware,
  learningController.getTopicContent,
);

module.exports = router;
