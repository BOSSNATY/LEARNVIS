const express = require("express");
const router = express.Router();

const learningStateController = require("../controllers/learningStateController");

const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/init", authMiddleware, learningStateController.initLearningState);

router.get("/", authMiddleware, learningStateController.getLearningState);

router.put(
  "/update",
  authMiddleware,
  learningStateController.updateLearningState,
);

module.exports = router;
