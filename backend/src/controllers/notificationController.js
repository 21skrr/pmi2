const Notification = require("../models/Notification");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/errorUtils");

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Private
 */
const getUserNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const isRead = req.query.isRead === "true";

  // Build query
  const query = {
    userId: req.user.id,
    ...(req.query.isRead !== undefined && { isRead }),
  };

  // Execute query
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Get total count
  const total = await Notification.countDocuments(query);

  // Get unread count
  const unreadCount = await Notification.countDocuments({
    userId: req.user.id,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    count: notifications.length,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    unreadCount,
    data: notifications,
  });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  // Check ownership
  if (notification.userId.toString() !== req.user.id) {
    throw new AppError("Not authorized to access this notification", 403);
  }

  // Update notification
  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    data: notification,
  });
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user.id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: "All notifications marked as read",
  });
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  // Check ownership
  if (notification.userId.toString() !== req.user.id) {
    throw new AppError("Not authorized to delete this notification", 403);
  }

  await notification.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
