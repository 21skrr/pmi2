const Evaluation = require("../models/Evaluation");
const User = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/errorUtils");
const Activity = require("../models/Activity");
const Notification = require("../models/Notification");

/**
 * @desc    Get evaluations for an employee
 * @route   GET /api/evaluations/:employeeId
 * @access  Private
 */
const getEvaluations = asyncHandler(async (req, res) => {
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
        "Not authorized to access evaluations for this employee",
        403
      );
    }
  }

  // Get evaluations
  const evaluations = await Evaluation.find({ employeeId })
    .populate("supervisorId", "fullName role")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: evaluations.length,
    data: evaluations,
  });
});

/**
 * @desc    Get a single evaluation
 * @route   GET /api/evaluations/item/:id
 * @access  Private
 */
const getEvaluation = asyncHandler(async (req, res) => {
  const evaluation = await Evaluation.findById(req.params.id)
    .populate("employeeId", "fullName email department")
    .populate("supervisorId", "fullName role");

  if (!evaluation) {
    throw new AppError("Evaluation not found", 404);
  }

  // Check authorization
  if (
    req.user.id !== evaluation.employeeId._id.toString() &&
    req.user.id !== evaluation.supervisorId._id.toString() &&
    req.user.role !== "hr"
  ) {
    const employee = await User.findById(evaluation.employeeId._id);

    if (
      req.user.role !== "manager" ||
      employee.department !== req.user.department
    ) {
      throw new AppError("Not authorized to access this evaluation", 403);
    }
  }

  res.status(200).json({
    success: true,
    data: evaluation,
  });
});

/**
 * @desc    Create an evaluation
 * @route   POST /api/evaluations
 * @access  Private (Supervisor, HR)
 */
const createEvaluation = asyncHandler(async (req, res) => {
  const {
    employeeId,
    type,
    criteria,
    strengths,
    areasForImprovement,
    comments,
    dueDate,
  } = req.body;

  // Check if employee exists
  const employee = await User.findById(employeeId);
  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  // Check authorization
  if (req.user.role !== "hr") {
    if (
      req.user.role !== "supervisor" ||
      employee.assignedSupervisor?.toString() !== req.user.id
    ) {
      throw new AppError(
        "Not authorized to create evaluations for this employee",
        403
      );
    }
  }

  // Create evaluation
  const evaluation = await Evaluation.create({
    employeeId,
    supervisorId:
      req.user.role === "hr" ? employee.assignedSupervisor : req.user.id,
    type,
    criteria,
    strengths,
    areasForImprovement,
    comments,
    status: "pending",
    dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days from now
  });

  // Calculate overall score
  evaluation.calculateOverallScore();
  await evaluation.save();

  // Create notification for employee
  await Notification.create({
    userId: employeeId,
    title: "New Evaluation",
    message: `A new ${type} evaluation has been created for you`,
    type: "info",
    relatedEntity: "evaluation",
    relatedEntityId: evaluation._id,
  });

  // Create notification for supervisor if created by HR
  if (req.user.role === "hr" && employee.assignedSupervisor) {
    await Notification.create({
      userId: employee.assignedSupervisor,
      title: "Evaluation Assignment",
      message: `You need to complete a ${type} evaluation for ${employee.fullName}`,
      type: "info",
      relatedEntity: "evaluation",
      relatedEntityId: evaluation._id,
    });
  }

  // Log activity
  await Activity.create({
    user: req.user.id,
    action: "Evaluation created",
    details: `${req.user.fullName} created ${type} evaluation for ${employee.fullName}`,
    entityType: "evaluation",
    entityId: evaluation._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(201).json({
    success: true,
    data: evaluation,
  });
});

/**
 * @desc    Update an evaluation
 * @route   PUT /api/evaluations/:id
 * @access  Private
 */
const updateEvaluation = asyncHandler(async (req, res) => {
  let evaluation = await Evaluation.findById(req.params.id);

  if (!evaluation) {
    throw new AppError("Evaluation not found", 404);
  }

  // Check authorization
  if (
    req.user.id !== evaluation.supervisorId.toString() &&
    req.user.role !== "hr"
  ) {
    throw new AppError("Not authorized to update this evaluation", 403);
  }

  // Don't allow updating completed evaluations
  if (evaluation.status === "completed" && req.user.role !== "hr") {
    throw new AppError("Cannot update a completed evaluation", 400);
  }

  // Update evaluation
  evaluation = await Evaluation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // Recalculate overall score
  evaluation.calculateOverallScore();

  // Mark as completed if status changed to completed
  if (req.body.status === "completed" && evaluation.status !== "completed") {
    evaluation.completedDate = new Date();
    evaluation.status = "completed";

    // Notify employee
    await Notification.create({
      userId: evaluation.employeeId,
      title: "Evaluation Completed",
      message: `Your ${evaluation.type} evaluation has been completed`,
      type: "info",
      relatedEntity: "evaluation",
      relatedEntityId: evaluation._id,
    });
  }

  await evaluation.save();

  // Log activity
  await Activity.create({
    user: req.user.id,
    action: "Evaluation updated",
    details: `${req.user.fullName} updated evaluation`,
    entityType: "evaluation",
    entityId: evaluation._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    data: evaluation,
  });
});

/**
 * @desc    Delete an evaluation
 * @route   DELETE /api/evaluations/:id
 * @access  Private (HR only)
 */
const deleteEvaluation = asyncHandler(async (req, res) => {
  const evaluation = await Evaluation.findById(req.params.id);

  if (!evaluation) {
    throw new AppError("Evaluation not found", 404);
  }

  await evaluation.deleteOne();

  // Log activity
  await Activity.create({
    user: req.user.id,
    action: "Evaluation deleted",
    details: `${req.user.fullName} deleted evaluation`,
    entityType: "evaluation",
    entityId: evaluation._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

module.exports = {
  getEvaluations,
  getEvaluation,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
};
