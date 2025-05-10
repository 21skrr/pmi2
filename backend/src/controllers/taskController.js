const Task = require("../models/Task");
const User = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/errorUtils");
const Activity = require("../models/Activity");
const Notification = require("../models/Notification");

/**
 * @desc    Get tasks for an employee
 * @route   GET /api/tasks
 * @access  Private
 */
const getTasks = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const employeeId = req.query.employeeId || req.user.id;
  const isCompleted = req.query.isCompleted === "true";

  // Check authorization
  if (req.user.id !== employeeId && req.user.role !== "hr") {
    const employee = await User.findById(employeeId);
    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    if (
      (req.user.role !== "supervisor" ||
        employee.assignedSupervisor?.toString() !== req.user.id) &&
      (req.user.role !== "manager" ||
        employee.department !== req.user.department)
    ) {
      throw new AppError(
        "Not authorized to access tasks for this employee",
        403
      );
    }
  }

  // Build query
  const query = {
    employeeId,
    ...(req.query.isCompleted !== undefined && { isCompleted }),
  };

  // Execute query
  const tasks = await Task.find(query)
    .sort({ dueDate: 1, priority: -1 })
    .skip(skip)
    .limit(limit);

  // Get total count
  const total = await Task.countDocuments(query);

  res.status(200).json({
    success: true,
    count: tasks.length,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: tasks,
  });
});

/**
 * @desc    Get a single task
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // Check authorization
  if (req.user.id !== task.employeeId.toString() && req.user.role !== "hr") {
    const employee = await User.findById(task.employeeId);

    if (
      (req.user.role !== "supervisor" ||
        employee.assignedSupervisor?.toString() !== req.user.id) &&
      (req.user.role !== "manager" ||
        employee.department !== req.user.department)
    ) {
      throw new AppError("Not authorized to access this task", 403);
    }
  }

  res.status(200).json({
    success: true,
    data: task,
  });
});

/**
 * @desc    Create a task
 * @route   POST /api/tasks
 * @access  Private (HR, Supervisor, Manager)
 */
const createTask = asyncHandler(async (req, res) => {
  const { title, description, employeeId, dueDate, priority, phase } = req.body;

  // Check if employee exists
  const employee = await User.findById(employeeId);
  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  // Check authorization
  if (req.user.role !== "hr") {
    if (
      (req.user.role !== "supervisor" ||
        employee.assignedSupervisor?.toString() !== req.user.id) &&
      (req.user.role !== "manager" ||
        employee.department !== req.user.department)
    ) {
      throw new AppError(
        "Not authorized to create tasks for this employee",
        403
      );
    }
  }

  // Create task
  const task = await Task.create({
    title,
    description,
    employeeId,
    dueDate,
    priority: priority || "medium",
    phase: phase || "prepare",
    assignedBy: req.user.id,
  });

  // Create notification for employee
  await Notification.create({
    userId: employeeId,
    title: "New Task Assigned",
    message: `You have been assigned a new task: ${title}`,
    type: "info",
    relatedEntity: "task",
    relatedEntityId: task._id,
  });

  // Log activity
  await Activity.create({
    user: req.user.id,
    action: "Task created",
    details: `${req.user.fullName} created task "${title}" for ${employee.fullName}`,
    entityType: "task",
    entityId: task._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(201).json({
    success: true,
    data: task,
  });
});

/**
 * @desc    Update a task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = asyncHandler(async (req, res) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // Check authorization
  if (req.user.id !== task.assignedBy.toString() && req.user.role !== "hr") {
    throw new AppError("Not authorized to update this task", 403);
  }

  // Don't allow changing the employee
  if (
    req.body.employeeId &&
    req.body.employeeId !== task.employeeId.toString()
  ) {
    throw new AppError("Changing task employee is not allowed", 400);
  }

  // Update task
  task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // Log activity
  await Activity.create({
    user: req.user.id,
    action: "Task updated",
    details: `${req.user.fullName} updated task "${task.title}"`,
    entityType: "task",
    entityId: task._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    data: task,
  });
});

/**
 * @desc    Mark task as complete/incomplete
 * @route   PUT /api/tasks/:id/complete
 * @access  Private
 */
const toggleTaskCompletion = asyncHandler(async (req, res) => {
  const { isCompleted } = req.body;

  if (isCompleted === undefined) {
    throw new AppError("Please provide isCompleted status", 400);
  }

  let task = await Task.findById(req.params.id);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // Only the employee or HR can mark tasks as complete
  if (req.user.id !== task.employeeId.toString() && req.user.role !== "hr") {
    const employee = await User.findById(task.employeeId);

    if (
      (req.user.role !== "supervisor" ||
        employee.assignedSupervisor?.toString() !== req.user.id) &&
      (req.user.role !== "manager" ||
        employee.department !== req.user.department)
    ) {
      throw new AppError("Not authorized to update this task", 403);
    }
  }

  // Update completion status
  task.isCompleted = isCompleted;
  task.completedAt = isCompleted ? new Date() : null;
  task.completedBy = isCompleted ? req.user.id : null;

  await task.save();

  // Notify task assigner
  if (isCompleted && task.assignedBy.toString() !== req.user.id) {
    await Notification.create({
      userId: task.assignedBy,
      title: "Task Completed",
      message: `Task "${task.title}" has been completed`,
      type: "success",
      relatedEntity: "task",
      relatedEntityId: task._id,
    });
  }

  // Log activity
  await Activity.create({
    user: req.user.id,
    action: isCompleted ? "Task completed" : "Task marked as incomplete",
    details: `${req.user.fullName} marked task "${task.title}" as ${
      isCompleted ? "completed" : "incomplete"
    }`,
    entityType: "task",
    entityId: task._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    data: task,
  });
});

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private (HR, Task Creator)
 */
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // Check authorization
  if (req.user.id !== task.assignedBy.toString() && req.user.role !== "hr") {
    throw new AppError("Not authorized to delete this task", 403);
  }

  await task.deleteOne();

  // Log activity
  await Activity.create({
    user: req.user.id,
    action: "Task deleted",
    details: `${req.user.fullName} deleted task "${task.title}"`,
    entityType: "task",
    entityId: task._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  toggleTaskCompletion,
  deleteTask,
};
