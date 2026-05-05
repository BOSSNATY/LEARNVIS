const express = require("express");
const router = express.Router();

const topicController = require("../controllers/topicController");

const { authMiddleware } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");

router.post("/", authMiddleware, topicController.createTopic);

router.get("/single/:id", authMiddleware, topicController.getTopic);

router.get("/:id/start", authMiddleware, topicController.startTopic);

router.get("/:subjectId", authMiddleware, topicController.getTopicsBySubject);

router.delete("/topics/:id", authMiddleware, topicController.deleteTopic);

module.exports = router;
