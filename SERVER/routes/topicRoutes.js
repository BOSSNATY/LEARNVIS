const express = require("express");
const router = express.Router();

const topicController = require("../controllers/topicController");

const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/", authMiddleware, topicController.createTopic);

module.exports = router;
