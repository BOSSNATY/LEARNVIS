const express = require("express");
const router = express.Router();

const subjectController = require("../controllers/subjectController");

const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/select", authMiddleware, subjectController.selectSubjects);
router.post("/subject", authMiddleware, subjectController.createSubject);
router.get("/subjects", authMiddleware, subjectController.getUserSubjects);

module.exports = router;
