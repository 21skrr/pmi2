const User = require("../models/User");
const EmployeeProgress = require("../models/EmployeeProgress");
const OnboardingTemplate = require("../models/OnboardingTemplate");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/errorUtils");
const Activity = require("../models/Activity");
const logger = require("../config/logger");

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private (HR, Manager)
 */
const getUsers = asyncHandler(async (req, res) => {
  // Parse query parameters
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const role = req.query.role;
  const department = req.query.department;
  const status = req.query.status;
  const programType = req.query.programType;
  const search = req.query.search;

  // Build query
  let query = {};

  if (role) query.role = role;
  if (department) query.department = department;
  if (status) query.status = status;
  if (programType) query.programType = programType;

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  // For managers, only return users in their department
  if (req.user.role === "manager") {
    query.department = req.user.department;
  }

  // For supervisors, only return their assigned employees
  if (req.user.role === "supervisor") {
    query.assignedSupervisor = req.user.id;
  }

  // Execute query with pagination
  const users = await User.find(query)
    .skip(skip)
    .limit(limit)
    .select("-passwordHash");

  // Get total count
  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: users.length,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: users,
  });
});

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Access control
  if (
    req.user.role !== "hr" &&
    req.user.id !== req.params.id &&
    (req.user.role !== "supervisor" ||
      user.assignedSupervisor?.toString() !== req.user.id) &&
    (req.user.role !== "manager" || user.department !== req.user.department)
  ) {
    throw new AppError("Not authorized to access this user", 403);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * @desc    Create user
 * @route   POST /api/users
 * @access  Private (HR only)
 */
const createUser = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    password,
    role,
    department,
    assignedSupervisor,
    programType,
    startDate,
  } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new AppError("User already exists", 400);
  }

  // Create user
  const user = await User.create({
    fullName,
    email,
    passwordHash: password,
    role,
    department,
    assignedSupervisor,
    programType,
    startDate: startDate || new Date(),
  });

  // If employee, initialize onboarding progress
  if (role === "employee") {
    await initializeOnboarding(user._id);
  }

  // Log activity
  await Activity.create({
    user: req.user.id,
    action: "User created",
    details: `${req.user.fullName} created user ${user.fullName}`,
    entityType: "user",
    entityId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(201).json({
    success: true,
    data: user,
  });
});

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private
 */
const updateUser = asyncHandler(async (req, res) => {
  // Find user
  let user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Access control
  if (req.user.role !== "hr" && req.user.id !== req.params.id) {
    throw new AppError("Not authorized to update this user", 403);
  }

  // Regular users can only update certain fields
  if (req.user.role !== "hr" && req.user.id === req.params.id) {
    const allowedFields = ["fullName", "email"];
    const requestedUpdates = Object.keys(req.body);

    const isValidUpdate = requestedUpdates.every((update) =>
      allowedFields.includes(update)
    );

    if (!isValidUpdate) {
      throw new AppError("You can only update your name and email", 400);
    }
  }

  // Don't allow password updates through this endpoint
  if (req.body.password || req.body.passwordHash) {
    throw new AppError(
      "Password updates not allowed through this endpoint",
      400
    );
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).select("-passwordHash");

  // Log activity
  await Activity.create({
    user: req.user.id,
    action: "User updated",
    details: `${req.user.fullName} updated user ${updatedUser.fullName}`,
    entityType: "user",
    entityId: updatedUser._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    data: updatedUser,
  });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private (HR only)
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  await user.deleteOne();

  // Log activity
  await Activity.create({
    user: req.user.id,
    action: "User deleted",
    details: `${req.user.fullName} deleted user ${user.fullName}`,
    entityType: "user",
    entityId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

/**
 * Helper function to initialize onboarding progress for a new employee
 */
const initializeOnboarding = async (employeeId) => {
  try {
    // Get onboarding templates
    const templates = await OnboardingTemplate.find({ isActive: true }).sort({
      phase: 1,
    });

    // Create progress phases from templates
    const phases = templates.map((template) => {
      return {
        phase: template.phase,
        tasks: template.tasks.map((task) => ({
          name: task.name,
          completed: false,
        })),
        startDate: template.phase === "prepare" ? new Date() : null,
        completionPercentage: 0,
      };
    });

    // Create employee progress record
    await EmployeeProgress.create({
      employeeId,
      progress: phases,
      currentPhase: "prepare",
      overallProgress: 0,
      startDate: new Date(),
      status: "in_progress",
    });

    logger.info(`Initialized onboarding for employee ${employeeId}`);
  } catch (error) {
    logger.error(`Error initializing onboarding: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
