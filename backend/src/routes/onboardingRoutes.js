const express = require("express");
const {
  getOnboardingProgress,
  updateTask,
  getOnboardingTemplate,
  updateOnboardingTemplate,
} = require("../controllers/onboardingController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Protect all routes
router.use(authenticate);

// Get onboarding progress
router.get("/:employeeId", getOnboardingProgress);

// Update task completion
router.put(
  "/:employeeId/update-task",
  authorize(["hr", "supervisor", "manager"]),
  updateTask
);

// Template routes
router.get("/template", getOnboardingTemplate);
router.post("/template", authorize(["hr"]), updateOnboardingTemplate);

module.exports = router;
