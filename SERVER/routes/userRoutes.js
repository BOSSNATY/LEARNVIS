const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");

// GET /api/users
router.get("/", authMiddleware, adminMiddleware, userController.getUsers);

// GET /api/users/me
router.get("/me", authMiddleware, userController.getMe);

// PUT /api/users/me
router.put("/me", authMiddleware, userController.updateMe);

// PUT /api/users/:id
router.put("/:id", authMiddleware, adminMiddleware, userController.updateUser);

// DELETE /api/users/:id
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  userController.deleteUser,
);

module.exports = router;
