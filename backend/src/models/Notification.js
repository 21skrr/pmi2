const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ["info", "warning", "success", "error"],
        message: "Type must be: info, warning, success, or error",
      },
      default: "info",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      trim: true,
    },
    relatedEntity: {
      type: String,
      enum: {
        values: [
          "task",
          "event",
          "feedback",
          "evaluation",
          "coaching",
          "course",
        ],
        message:
          "Related entity must be: task, event, feedback, evaluation, coaching, or course",
      },
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster querying
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
