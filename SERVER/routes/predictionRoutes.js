const express = require("express");
const router = express.Router();
const predictionController = require("../controllers/predictionController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/", authMiddleware, predictionController.getAllPredictions);
router.get("/:subjectId", authMiddleware, predictionController.getPrediction);

module.exports = router;
