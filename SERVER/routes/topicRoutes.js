const express = require("express");
const router = express.Router();

const topicController = require("../controllers/topicController");

const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/", authMiddleware, topicController.createTopic);

router.get("/:subjectId", authMiddleware, topicController.getTopicsBySubject);

router.get("/single/:id", authMiddleware, topicController.getTopic);

module.exports = router;
