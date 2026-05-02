const express = require("express");
const router = express.Router();

const mistakeController = require("../controllers/mistakeController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/", authMiddleware, mistakeController.addMistake);

router.get("/weak-topics", authMiddleware, mistakeController.getWeakTopics);

router.get(
  "/topic/:topicId",
  authMiddleware,
  mistakeController.getMistakesByTopic,
);

module.exports = router;
