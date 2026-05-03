const express = require("express");
const router = express.Router();
const studyPlanController = require("../controllers/studyPlanController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/", authMiddleware, studyPlanController.createStudyPlan);
router.get("/", authMiddleware, studyPlanController.getMyPlans);
router.post(
  "/:planId/generate",
  authMiddleware,
  studyPlanController.generateDailyTasks,
);
router.get("/:planId/tasks", authMiddleware, studyPlanController.getPlanTasks);
router.delete("/:planId", authMiddleware, studyPlanController.deletePlan);

module.exports = router;
