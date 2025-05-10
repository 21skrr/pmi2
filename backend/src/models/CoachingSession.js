const mongoose = require("mongoose");

const coachingSessionSchema = new mongoose.Schema(
  {
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Supervisor ID is required"],
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee ID is required"],
    },
    date: {
      type: Date,
      required: [true, "Session date is required"],
    },
    duration: {
      type: Number, // Duration in minutes
      min: 0,
      required: [true, "Session duration is required"],
    },
    topics: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    outcome: {
      type: String,
      trim: true,
    },
    followUpDate: Date,
    followUpActions: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: {
        values: ["scheduled", "completed", "cancelled"],
        message: "Status must be: scheduled, completed, or cancelled",
      },
      default: "scheduled",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster querying
coachingSessionSchema.index({ employeeId: 1 });
coachingSessionSchema.index({ supervisorId: 1 });
coachingSessionSchema.index({ date: 1 });

module.exports = mongoose.model("CoachingSession", coachingSessionSchema);
