const express = require("express");
const router = express.Router();

const studySessionsController = require("../controllers/studySessionsController");

const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/start", authMiddleware, studySessionsController.startSession);
router.post("/end", authMiddleware, studySessionsController.endSession);
router.post(
  "/start-from-task/:taskId",
  authMiddleware,
  studySessionsController.startFromTask,
);

module.exports = router;
