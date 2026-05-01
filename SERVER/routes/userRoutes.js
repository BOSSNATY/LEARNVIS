const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authMiddleware } = require("../middleware/authMiddleware");

// GET /api/users/me
router.get("/me", authMiddleware, userController.getMe);

// PUT /api/users/me
router.put("/me", authMiddleware, userController.updateMe);

module.exports = router;
