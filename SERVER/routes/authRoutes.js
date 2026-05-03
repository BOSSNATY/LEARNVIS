const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// POST /api/auth/signup
router.post("/signup", authController.signup);

router.post("/login", authController.login);
router.post("/google", authController.google);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refresh);

module.exports = router;
