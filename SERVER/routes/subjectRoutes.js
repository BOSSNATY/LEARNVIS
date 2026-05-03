const express = require("express");
const router = express.Router();

const subjectController = require("../controllers/subjectController");

const { authMiddleware } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");

router.post("/select", authMiddleware, subjectController.selectSubjects);
router.post(
  "/subject",
  authMiddleware,
  adminMiddleware,
  subjectController.createSubject,
);
router.get("/subjects", authMiddleware, subjectController.getUserSubjects);

module.exports = router;
