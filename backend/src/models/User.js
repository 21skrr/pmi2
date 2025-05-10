const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Please provide a full name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        "Please provide a valid email address",
      ],
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["employee", "supervisor", "manager", "hr"],
        message: "Role must be: employee, supervisor, manager, or hr",
      },
      required: [true, "User role is required"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["active", "under_review", "integrated"],
        message: "Status must be: active, under_review, or integrated",
      },
      default: "active",
    },
    assignedSupervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    programType: {
      type: String,
      enum: {
        values: [
          "inkompass",
          "earlyTalent",
          "apprenticeship",
          "academicPlacement",
          "workExperience",
        ],
        message: "Invalid program type",
      },
    },
    onboardingStage: {
      type: String,
      enum: {
        values: ["prepare", "orient", "land", "integrate", "excel"],
        message: "Invalid onboarding stage",
      },
      default: "prepare",
    },
    onboardingProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    feedbacks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Feedback",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for evaluations
userSchema.virtual("evaluations", {
  ref: "Evaluation",
  localField: "_id",
  foreignField: "employeeId",
});

// Method to check if password is correct
userSchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.passwordHash);
};

// Pre-save middleware to hash the password
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified
  if (!this.isModified("passwordHash")) {
    return next();
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("User", userSchema);
