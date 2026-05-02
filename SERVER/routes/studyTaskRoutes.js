const express = require("express");
const router = express.Router();

const studyTaskController = require("../controllers/studyTaskController");

const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/today", authMiddleware, studyTaskController.getTodayTasks);

router.post(
  "/:taskId/complete",
  authMiddleware,
  studyTaskController.completeTask,
);

module.exports = router;
