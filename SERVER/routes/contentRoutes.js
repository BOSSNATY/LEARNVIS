const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const contentController = require("../controllers/contentController");
const { authMiddleware } = require("../middleware/authMiddleware");

const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

router.post("/generate", authMiddleware, contentController.generateContent);
router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  contentController.uploadContent,
);
router.get("/:topicId", authMiddleware, contentController.getContent);

module.exports = router;
