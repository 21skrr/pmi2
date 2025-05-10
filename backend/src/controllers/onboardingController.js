const EmployeeProgress = require("../models/EmployeeProgress");
const OnboardingTemplate = require("../models/OnboardingTemplate");
const User = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/errorUtils");
const Activity = require("../models/Activity");
const { sendTaskNotification } = require("../services/emailService");

/**
 * @desc    Get onboarding progress for an employee
 * @route   GET /api/onboarding/:employeeId
 * @access  Private
 */
const getOnboardingProgress = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  // Find employee
  const employee = await User.findById(employeeId);
  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  // Check authorization
  if (
    req.user.role !== "hr" &&
    req.user.id !== employeeId &&
    (req.user.role !== "supervisor" ||
      employee.assignedSupervisor?.toString() !== req.user.id) &&
    (req.user.role !== "manager" || employee.department !== req.user.department)
  ) {
    throw new AppError(
      "Not authorized to access this employee's onboarding progress",
      403
    );
  }

  // Get progress
  const progress = await EmployeeProgress.findOne({ employeeId });
  if (!progress) {
    throw new AppError("Onboarding progress not found", 404);
  }

  res.status(200).json({
    success: true,
    data: progress,
  });
});

/**
 * @desc    Update task completion status
 * @route   PUT /api/onboarding/:employeeId/update-task
 * @access  Private (HR, Supervisor, Manager)
 */
const updateTask = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const { phase, taskId, completed, notes } = req.body;

  // Validate input
  if (!phase || taskId === undefined || completed === undefined) {
    throw new AppError(
      "Please provide phase, taskId, and completed status",
      400
    );
  }

  // Find employee
  const employee = await User.findById(employeeId);
  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  // Check authorization
  if (
    req.user.role !== "hr" &&
    (req.user.role !== "supervisor" ||
      employee.assignedSupervisor?.toString() !== req.user.id) &&
    (req.user.role !== "manager" || employee.department !== req.user.department)
  ) {
    throw new AppError("Not authorized to update tasks for this employee", 403);
  }

  // Get progress
  const progress = await EmployeeProgress.findOne({ employeeId });
  if (!progress) {
    throw new AppError("Onboarding progress not found", 404);
  }

  // Find the phase
  const phaseIndex = progress.progress.findIndex((p) => p.phase === phase);
  if (phaseIndex === -1) {
    throw new AppError("Phase not found", 404);
  }

  // Find the task
  const taskIndex = progress.progress[phaseIndex].tasks.findIndex(
    (t) => t._id.toString() === taskId
  );
  if (taskIndex === -1) {
    throw new AppError("Task not found", 404);
  }

  // Update task
  progress.progress[phaseIndex].tasks[taskIndex].completed = completed;
  if (completed) {
    progress.progress[phaseIndex].tasks[taskIndex].completedAt = new Date();
    progress.progress[phaseIndex].tasks[taskIndex].completedBy = req.user.id;
  } else {
    progress.progress[phaseIndex].tasks[taskIndex].completedAt = null;
    progress.progress[phaseIndex].tasks[taskIndex].completedBy = null;
  }

  if (notes) {
    progress.progress[phaseIndex].tasks[taskIndex].notes = notes;
  }

  // Update phase completion percentage
  const totalTasks = progress.progress[phaseIndex].tasks.length;
  const completedTasks = progress.progress[phaseIndex].tasks.filter(
    (t) => t.completed
  ).length;
  progress.progress[phaseIndex].completionPercentage = Math.round(
    (completedTasks / totalTasks) * 100
  );

  // Check if phase is completed
  if (
    progress.progress[phaseIndex].completionPercentage === 100 &&
    !progress.progress[phaseIndex].completionDate
  ) {
    progress.progress[phaseIndex].completionDate = new Date();

    // Move to next phase if available
    if (phaseIndex < progress.progress.length - 1) {
      progress.currentPhase = progress.progress[phaseIndex + 1].phase;
      progress.progress[phaseIndex + 1].startDate = new Date();
    } else {
      // All phases completed
      progress.status = "completed";
      progress.actualCompletionDate = new Date();

      // Update employee status
      await User.findByIdAndUpdate(employeeId, { status: "integrated" });
    }
  }

  // Update user's onboarding progress percentage
  await User.findByIdAndUpdate(employeeId, {
    onboardingProgress: progress.overallProgress,
  });

  // Save changes
  await progress.save();

  // Log activity
  await Activity.create({
    user: req.user.id,
    action: `Task ${completed ? "completed" : "uncompleted"}`,
    details: `${req.user.fullName} marked task as ${
      completed ? "completed" : "incomplete"
    } for ${employee.fullName}`,
    entityType: "onboarding",
    entityId: progress._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    data: progress,
  });
});

/**
 * @desc    Get onboarding template
 * @route   GET /api/onboarding/template
 * @access  Private
 */
const getOnboardingTemplate = asyncHandler(async (req, res) => {
  const templates = await OnboardingTemplate.find({ isActive: true }).sort({
    phase: 1,
  });

  res.status(200).json({
    success: true,
    data: templates,
  });
});

/**
 * @desc    Create/update onboarding template
 * @route   POST /api/onboarding/template
 * @access  Private (HR only)
 */
const updateOnboardingTemplate = asyncHandler(async (req, res) => {
  const { phase, tasks } = req.body;

  // Validate input
  if (!phase || !tasks || !Array.isArray(tasks)) {
    throw new AppError("Please provide phase and tasks array", 400);
  }

  // Find existing template for this phase
  let template = await OnboardingTemplate.findOne({ phase, isActive: true });

  if (template) {
    // Update existing template
    template.tasks = tasks;
    await template.save();
  } else {
    // Create new template
    template = await OnboardingTemplate.create({
      phase,
      tasks,
      isActive: true,
    });
  }

  // Log activity
  await Activity.create({
    user: req.user.id,
    action: "Template updated",
    details: `${req.user.fullName} updated onboarding template for phase ${phase}`,
    entityType: "onboarding",
    entityId: template._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    data: template,
  });
});

module.exports = {
  getOnboardingProgress,
  updateTask,
  getOnboardingTemplate,
  updateOnboardingTemplate,
};
