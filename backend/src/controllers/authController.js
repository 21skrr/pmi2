const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/errorUtils");
const Activity = require("../models/Activity");

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, role, department, programType } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new AppError("User already exists", 400);
  }

  // Create user
  const user = await User.create({
    fullName,
    email,
    passwordHash: password, // Will be hashed via pre-save middleware
    role: role || "employee",
    department,
    programType,
  });

  // Generate token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  // Remove sensitive data
  user.passwordHash = undefined;

  // Log activity
  await Activity.create({
    user: user._id,
    action: "User registered",
    details: `${user.fullName} registered as ${user.role}`,
    entityType: "user",
    entityId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(201).json({
    success: true,
    token,
    data: {
      user,
    },
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    throw new AppError("Please provide email and password", 400);
  }

  // Find user
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  // Check if password is correct
  const isMatch = await user.isValidPassword(password);
  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  // Generate token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  // Remove sensitive data
  user.passwordHash = undefined;

  // Log activity
  await Activity.create({
    user: user._id,
    action: "User logged in",
    details: `${user.fullName} logged in`,
    entityType: "user",
    entityId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    token,
    data: {
      user,
    },
  });
});

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword) {
    throw new AppError("Please provide current and new password", 400);
  }

  // Get user with password
  const user = await User.findById(req.user.id).select("+passwordHash");

  // Check current password
  const isMatch = await user.isValidPassword(currentPassword);
  if (!isMatch) {
    throw new AppError("Current password is incorrect", 401);
  }

  // Update password
  user.passwordHash = newPassword;
  await user.save();

  // Log activity
  await Activity.create({
    user: user._id,
    action: "Password changed",
    details: `${user.fullName} changed their password`,
    entityType: "user",
    entityId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

module.exports = {
  register,
  login,
  getMe,
  changePassword,
};
