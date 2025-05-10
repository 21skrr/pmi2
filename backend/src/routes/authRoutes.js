const express = require("express");
const {
  register,
  login,
  getMe,
  changePassword,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", authenticate, getMe);
router.put("/password", authenticate, changePassword);

module.exports = router;
