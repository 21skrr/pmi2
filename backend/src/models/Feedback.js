const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee ID is required"],
    },
    filledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Filled by is required"],
    },
    type: {
      type: String,
      enum: {
        values: ["3-month", "6-month", "12-month", "general"],
        message: "Type must be: 3-month, 6-month, 12-month, or general",
      },
      required: [true, "Feedback type is required"],
    },
    answers: {
      type: Map,
      of: String,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    strengths: [String],
    areasForImprovement: [String],
    additionalComments: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster querying
feedbackSchema.index({ employeeId: 1 });
feedbackSchema.index({ filledBy: 1 });

module.exports = mongoose.model("Feedback", feedbackSchema);
