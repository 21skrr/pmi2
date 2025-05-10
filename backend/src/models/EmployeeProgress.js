const mongoose = require("mongoose");

const taskProgressSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
  },
  name: {
    type: String,
    required: [true, "Task name is required"],
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  notes: String,
});

const phaseProgressSchema = new mongoose.Schema({
  phase: {
    type: String,
    enum: {
      values: ["prepare", "orient", "land", "integrate", "excel"],
      message: "Phase must be: prepare, orient, land, integrate, or excel",
    },
    required: [true, "Phase is required"],
  },
  tasks: [taskProgressSchema],
  startDate: {
    type: Date,
    default: Date.now,
  },
  completionDate: Date,
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
});

const employeeProgressSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee ID is required"],
    },
    progress: [phaseProgressSchema],
    currentPhase: {
      type: String,
      enum: {
        values: ["prepare", "orient", "land", "integrate", "excel"],
        message: "Phase must be: prepare, orient, land, integrate, or excel",
      },
      default: "prepare",
    },
    overallProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    controlledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    estimatedCompletionDate: Date,
    actualCompletionDate: Date,
    status: {
      type: String,
      enum: {
        values: ["in_progress", "completed", "on_hold"],
        message: "Status must be: in_progress, completed, or on_hold",
      },
      default: "in_progress",
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster querying by employeeId
employeeProgressSchema.index({ employeeId: 1 });

// Method to update overall progress
employeeProgressSchema.methods.updateOverallProgress = function () {
  if (!this.progress || this.progress.length === 0) {
    this.overallProgress = 0;
    return;
  }

  const totalPhases = this.progress.length;
  const totalProgress = this.progress.reduce(
    (acc, phase) => acc + phase.completionPercentage,
    0
  );
  this.overallProgress = Math.round(totalProgress / totalPhases);
};

// Pre-save middleware to update overall progress
employeeProgressSchema.pre("save", function (next) {
  this.updateOverallProgress();
  next();
});

module.exports = mongoose.model("EmployeeProgress", employeeProgressSchema);
