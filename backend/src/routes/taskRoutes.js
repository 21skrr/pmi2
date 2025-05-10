const express = require("express");
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  toggleTaskCompletion,
  deleteTask,
} = require("../controllers/taskController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Protect all routes
router.use(authenticate);

// Task routes
router
  .route("/")
  .get(getTasks)
  .post(authorize(["hr", "supervisor", "manager"]), createTask);

router.route("/:id").get(getTask).put(updateTask).delete(deleteTask);

router.put("/:id/complete", toggleTaskCompletion);

module.exports = router;
