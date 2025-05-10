const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee ID is required"],
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    priority: {
      type: String,
      enum: {
        values: ["high", "medium", "low"],
        message: "Priority must be: high, medium, or low",
      },
      default: "medium",
    },
    phase: {
      type: String,
      enum: {
        values: ["prepare", "orient", "land", "integrate", "excel"],
        message: "Phase must be: prepare, orient, land, integrate, or excel",
      },
      required: [true, "Phase is required"],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigned by is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster querying
taskSchema.index({ employeeId: 1, isCompleted: 1 });
taskSchema.index({ dueDate: 1 });

module.exports = mongoose.model("Task", taskSchema);
