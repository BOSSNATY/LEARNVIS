const express = require("express");
const router = express.Router();

const topicController = require("../controllers/topicController");

const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/", authMiddleware, topicController.createTopic);

router.get("/single/:id", authMiddleware, topicController.getTopic);

router.get("/:subjectId", authMiddleware, topicController.getTopicsBySubject);

router.get("/:id/start", authMiddleware, topicController.startTopic);

module.exports = router;
