const express = require("express");
const {
  getFeedback,
  getSingleFeedback,
  createFeedback,
  updateFeedback,
  deleteFeedback,
} = require("../controllers/feedbackController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Protect all routes
router.use(authenticate);

// Feedback routes
router.post("/", createFeedback);
router.get("/:employeeId", getFeedback);
router.get("/item/:id", getSingleFeedback);
router.put("/:id", updateFeedback);
router.delete("/:id", authorize(["hr"]), deleteFeedback);

module.exports = router;
