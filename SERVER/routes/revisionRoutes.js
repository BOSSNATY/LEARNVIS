const express = require("express");
const router = express.Router();
const revisionController = require("../controllers/revisionController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/due", authMiddleware, revisionController.getDueRevisions);
router.get("/history", authMiddleware, revisionController.getRevisionHistory);
router.post("/schedule", authMiddleware, revisionController.scheduleRevision);
router.post("/:revisionId/complete", authMiddleware, revisionController.completeRevision);

module.exports = router;
