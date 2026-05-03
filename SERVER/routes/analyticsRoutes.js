const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/overview", authMiddleware, analyticsController.getOverview);
router.get("/mistakes", authMiddleware, analyticsController.getMistakeAnalysis);
router.get(
  "/subject/:subjectId",
  authMiddleware,
  analyticsController.getSubjectAnalytics,
);

module.exports = router;
