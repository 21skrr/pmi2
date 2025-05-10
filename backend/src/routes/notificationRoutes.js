const express = require("express");
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Protect all routes
router.use(authenticate);

// Notification routes
router.get("/", getUserNotifications);
router.put("/:id/read", markAsRead);
router.put("/read-all", markAllAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
