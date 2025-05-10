const express = require("express");
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Protect all routes
router.use(authenticate);

// HR and Manager only routes
router
  .route("/")
  .get(authorize(["hr", "manager", "supervisor"]), getUsers)
  .post(authorize(["hr"]), createUser);

// Routes with mixed permissions
router
  .route("/:id")
  .get(getUser) // Permission check inside controller
  .put(updateUser) // Permission check inside controller
  .delete(authorize(["hr"]), deleteUser);

module.exports = router;
