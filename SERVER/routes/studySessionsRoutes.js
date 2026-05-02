const express = require("express");
const router = express.Router();

const studySessionsController = require("../controllers/studySessionsController");

const { authMiddleware } = require("../middleware/authMiddleware");

router.post(
  "/start",
  authMiddleware,
  studySessionsController.startStudySession,
);

router.post("/end", authMiddleware, studySessionsController.endStudySession);

module.exports = router;
