const express = require("express");
const router = express.Router();

const studyPlanController = require("../controllers/studyPlanController");
const { authMiddleware } = require("../middleware/authMiddleware");

// Create plan
router.post("/", authMiddleware, studyPlanController.createStudyPlan);

// Generate tasks
router.post(
  "/:planId/generate",
  authMiddleware,
  studyPlanController.generateDailyTasks,
);

// Get user plans
router.get("/", authMiddleware, studyPlanController.getMyPlans);

// Get tasks of a plan
router.get("/:planId/tasks", authMiddleware, studyPlanController.getPlanTasks);

module.exports = router;
