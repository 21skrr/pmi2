const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Module title is required"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  content: {
    type: String,
    required: [true, "Module content is required"],
  },
  duration: {
    type: Number, // Duration in minutes
    required: [true, "Module duration is required"],
    min: 0,
  },
  order: {
    type: Number,
    required: [true, "Module order is required"],
    min: 1,
  },
});

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    modules: [moduleSchema],
    totalModules: {
      type: Number,
      min: 0,
      default: 0,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    targetAudience: {
      type: String,
      enum: {
        values: ["all", "employee", "supervisor", "manager", "hr"],
        message:
          "Target audience must be: all, employee, supervisor, manager, or hr",
      },
      default: "all",
    },
    isRequired: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to update total modules
courseSchema.pre("save", function (next) {
  if (this.modules) {
    this.totalModules = this.modules.length;
  }
  next();
});

module.exports = mongoose.model("Course", courseSchema);
