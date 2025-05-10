const mongoose = require("mongoose");

const criteriaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Criteria name is required"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  score: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, "Score is required"],
  },
  weight: {
    type: Number,
    min: 0,
    max: 1,
    default: 1,
  },
  comment: {
    type: String,
    trim: true,
  },
});

const evaluationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Employee ID is required"],
    },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Supervisor ID is required"],
    },
    type: {
      type: String,
      enum: {
        values: ["field", "probation", "periodic", "training"],
        message: "Type must be: field, probation, periodic, or training",
      },
      required: [true, "Evaluation type is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "in_progress", "completed"],
        message: "Status must be: pending, in_progress, or completed",
      },
      default: "pending",
    },
    criteria: [criteriaSchema],
    overallScore: {
      type: Number,
      min: 1,
      max: 5,
    },
    strengths: [String],
    areasForImprovement: [String],
    comments: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    completedDate: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for faster querying
evaluationSchema.index({ employeeId: 1 });
evaluationSchema.index({ supervisorId: 1 });
evaluationSchema.index({ status: 1 });

// Method to calculate overall score
evaluationSchema.methods.calculateOverallScore = function () {
  if (!this.criteria || this.criteria.length === 0) {
    this.overallScore = 0;
    return;
  }

  const totalWeight = this.criteria.reduce(
    (acc, criterion) => acc + criterion.weight,
    0
  );
  const weightedSum = this.criteria.reduce(
    (acc, criterion) => acc + criterion.score * criterion.weight,
    0
  );

  this.overallScore = Math.round((weightedSum / totalWeight) * 10) / 10;
};

// Pre-save middleware to calculate overall score
evaluationSchema.pre("save", function (next) {
  this.calculateOverallScore();
  next();
});

module.exports = mongoose.model("Evaluation", evaluationSchema);
