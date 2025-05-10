const Feedback = require("../models/Feedback");
const User = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/errorUtils");
const Activity = require("../models/Activity");
const Notification = require("../models/Notification");

/**
 * @desc    Get all feedback for a user
 * @route   GET /api/feedbacks/:employeeId
 * @access  Private
 */
const getFeedback = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  // Check if employee exists
  const employee = await User.findById(employeeId);
  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  // Check authorization
  if (req.user.id !== employeeId && req.user.role !== "hr") {
    if (
      (req.user.role !== "supervisor" ||
        employee.assignedSupervisor?.toString() !== req.user.id) &&
      (req.user.role !== "manager" ||
        employee.department !== req.user.department)
    ) {
      throw new AppError(
        "Not authorized to access feedback for this employee",
        403
      );
    }
  }

  // Get feedback
  const feedback = await Feedback.find({ employeeId })
    .populate("filledBy", "fullName role")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: feedback.length,
    data: feedback,
  });
});

/**
 * @desc    Get a single feedback item
 * @route   GET /api/feedbacks/item/:id
 * @access  Private
 */
const getSingleFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id)
    .populate("employeeId", "fullName email")
    .populate("filledBy", "fullName role");

  if (!feedback) {
    throw new AppError("Feedback not found", 404);
  }

  // Check authorization
  if (
    req.user.id !== feedback.employeeId._id.toString() &&
    req.user.id !== feedback.filledBy._id.toString() &&
    req.user.role !== "hr"
  ) {
    const employee = await User.findById(feedback.employeeId._id);

    if (
      (req.user.role !== "supervisor" ||
        employee.assignedSupervisor?.toString() !== req.user.id) &&
      (req.user.role !== "manager" ||
        employee.department !== req.user.department)
    ) {
      throw new AppError("Not authorized to access this feedback", 403);
    }
  }

  res.status(200).json({
    success: true,
    data: feedback,
  });
});

/**
 * @desc    Create feedback
 * @route   POST /api/feedbacks
 * @access  Private
 */
const createFeedback = asyncHandler(async (req, res) => {
  const {
    employeeId,
    type,
    answers,
    rating,
    strengths,
    areasForImprovement,
    additionalComments,
  } = req.body;

  // Check if employee exists
  const employee = await User.findById(employeeId);
  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  // Check authorization for feedback type
  if (type === "3-month" || type === "6-month" || type === "12-month") {
    if (
      req.user.role !== "hr" &&
      req.user.role !== "supervisor" &&
      req.user.role !== "manager"
    ) {
      throw new AppError("Not authorized to create this type of feedback", 403);
    }

    if (
      req.user.role === "supervisor" &&
      employee.assignedSupervisor?.toString() !== req.user.id
    ) {
      throw new AppError(
        "You can only provide feedback for your assigned employees",
        403
      );
    }

    if (
      req.user.role === "manager" &&
      employee.department !== req.user.department
    ) {
      throw new AppError(
        "You can only provide feedback for employees in your department",
        403
      );
    }
  }

  // Create feedback
  const feedback = await Feedback.create({
    employeeId,
    filledBy: req.user.id,
    type,
    answers,
    rating,
    strengths,
    areasForImprovement,
    additionalComments,
  });

  // Add feedback reference to employee
  await User.findByIdAndUpdate(employeeId, {
    $push: { feedbacks: feedback._id },
  });

  // Create notification for employee
  await Notification.create({
    userId: employeeId,
    title: "New Feedback Received",
    message: `You have received ${type} feedback from ${req.user.fullName}`,
    type: "info",
    relatedEntity: "feedback",
    relatedEntityId: feedback._id,
  });

  // Log activity
  await Activity.create({
    user: req.user.id,
    action: "Feedback created",
    details: `${req.user.fullName} created ${type} feedback for ${employee.fullName}`,
    entityType: "feedback",
    entityId: feedback._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(201).json({
    success: true,
    data: feedback,
  });
});

/**
 * @desc    Update feedback
 * @route   PUT /api/feedbacks/:id
 * @access  Private
 */
const updateFeedback = asyncHandler(async (req, res) => {
  let feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    throw new AppError("Feedback not found", 404);
  }

  // Check authorization
  if (req.user.id !== feedback.filledBy.toString() && req.user.role !== "hr") {
    throw new AppError("Not authorized to update this feedback", 403);
  }

  // Only allow updates within 24 hours of creation
  const timeSinceCreation = Date.now() - new Date(feedback.createdAt).getTime();
  const hoursElapsed = timeSinceCreation / (1000 * 60 * 60);

  if (hoursElapsed > 24 && req.user.role !== "hr") {
    throw new AppError(
      "Feedback can only be updated within 24 hours of creation",
      400
    );
  }

  // Update feedback
  feedback = await Feedback.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // Log activity
  await Activity.create({
    user: req.user.id,
    action: "Feedback updated",
    details: `${req.user.fullName} updated feedback`,
    entityType: "feedback",
    entityId: feedback._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    data: feedback,
  });
});

/**
 * @desc    Delete feedback
 * @route   DELETE /api/feedbacks/:id
 * @access  Private (HR only)
 */
const deleteFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    throw new AppError("Feedback not found", 404);
  }

  // Remove feedback reference from employee
  await User.findByIdAndUpdate(feedback.employeeId, {
    $pull: { feedbacks: feedback._id },
  });

  await feedback.deleteOne();

  // Log activity
  await Activity.create({
    user: req.user.id,
    action: "Feedback deleted",
    details: `${req.user.fullName} deleted feedback`,
    entityType: "feedback",
    entityId: feedback._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

module.exports = {
  getFeedback,
  getSingleFeedback,
  createFeedback,
  updateFeedback,
  deleteFeedback,
};
