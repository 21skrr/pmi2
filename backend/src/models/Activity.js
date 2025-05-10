const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      trim: true,
    },
    details: {
      type: String,
      trim: true,
    },
    entityType: {
      type: String,
      enum: {
        values: [
          "user",
          "task",
          "event",
          "feedback",
          "evaluation",
          "course",
          "onboarding",
        ],
        message:
          "Entity type must be: user, task, event, feedback, evaluation, course, or onboarding",
      },
      required: [true, "Entity type is required"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Entity ID is required"],
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster querying
activitySchema.index({ user: 1 });
activitySchema.index({ entityType: 1, entityId: 1 });
activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);
