const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Task name is required"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  roleControlledBy: {
    type: String,
    enum: {
      values: ["hr", "supervisor", "manager"],
      message: "Role must be: hr, supervisor, or manager",
    },
    required: [true, "Controlling role is required"],
  },
});

const onboardingTemplateSchema = new mongoose.Schema(
  {
    phase: {
      type: String,
      enum: {
        values: ["prepare", "orient", "land", "integrate", "excel"],
        message: "Phase must be: prepare, orient, land, integrate, or excel",
      },
      required: [true, "Phase is required"],
    },
    tasks: [taskSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness of phase
onboardingTemplateSchema.index({ phase: 1, isActive: 1 });

module.exports = mongoose.model("OnboardingTemplate", onboardingTemplateSchema);
