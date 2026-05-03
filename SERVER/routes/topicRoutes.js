const express = require("express");
const router = express.Router();

const topicController = require("../controllers/topicController");

const { authMiddleware } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");

router.post("/", authMiddleware, adminMiddleware, topicController.createTopic);

router.post("/custom", authMiddleware, topicController.createCustomTopic);

router.get("/single/:id", authMiddleware, topicController.getTopic);

router.get("/:id/start", authMiddleware, topicController.startTopic);

router.get("/:subjectId", authMiddleware, topicController.getTopicsBySubject);

module.exports = router;
