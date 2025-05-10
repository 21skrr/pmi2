const EmployeeProgress = require("../models/EmployeeProgress");
const OnboardingTemplate = require("../models/OnboardingTemplate");
const User = require("../models/User");
const { sendPhaseCompleteNotification } = require("./emailService");
const logger = require("../config/logger");
const { AppError } = require("../utils/errorUtils");

/**
 * Initialize onboarding for a new employee
 * @param {string} employeeId - Employee ID
 * @returns {Promise<Object>} Onboarding progress object
 */
const initializeOnboarding = async (employeeId) => {
  try {
    // Check if employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    // Check if employee already has onboarding progress
    const existingProgress = await EmployeeProgress.findOne({ employeeId });
    if (existingProgress) {
      throw new AppError("Employee already has onboarding progress", 400);
    }

    // Get onboarding templates
    const templates = await OnboardingTemplate.find({ isActive: true }).sort({
      phase: 1,
    });

    if (!templates || templates.length === 0) {
      throw new AppError("No active onboarding templates found", 404);
    }

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
    const progress = await EmployeeProgress.create({
      employeeId,
      progress: phases,
      currentPhase: "prepare",
      overallProgress: 0,
      startDate: new Date(),
      status: "in_progress",
    });

    // Update user's onboarding stage
    await User.findByIdAndUpdate(employeeId, {
      onboardingStage: "prepare",
      onboardingProgress: 0,
    });

    logger.info(`Initialized onboarding for employee ${employeeId}`);
    return progress;
  } catch (error) {
    logger.error(`Error initializing onboarding: ${error.message}`);
    throw error;
  }
};

/**
 * Update task completion status
 * @param {string} employeeId - Employee ID
 * @param {string} phase - Onboarding phase
 * @param {string} taskId - Task ID
 * @param {boolean} completed - Completion status
 * @param {string} completedBy - User ID who completed the task
 * @param {string} notes - Optional notes
 * @returns {Promise<Object>} Updated onboarding progress
 */
const updateTaskStatus = async (
  employeeId,
  phase,
  taskId,
  completed,
  completedBy,
  notes = ""
) => {
  try {
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
      progress.progress[phaseIndex].tasks[taskIndex].completedBy = completedBy;
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
    let phaseCompleted = false;

    if (
      progress.progress[phaseIndex].completionPercentage === 100 &&
      !progress.progress[phaseIndex].completionDate
    ) {
      progress.progress[phaseIndex].completionDate = new Date();
      phaseCompleted = true;

      // Move to next phase if available
      if (phaseIndex < progress.progress.length - 1) {
        progress.currentPhase = progress.progress[phaseIndex + 1].phase;
        progress.progress[phaseIndex + 1].startDate = new Date();

        // Update user's onboarding stage
        await User.findByIdAndUpdate(employeeId, {
          onboardingStage: progress.progress[phaseIndex + 1].phase,
        });
      } else {
        // All phases completed
        progress.status = "completed";
        progress.actualCompletionDate = new Date();

        // Update employee status
        await User.findByIdAndUpdate(employeeId, { status: "integrated" });
      }

      // Send notification email
      const employee = await User.findById(employeeId);
      if (employee) {
        await sendPhaseCompleteNotification(employee, phase);
      }
    }

    // Calculate overall progress
    progress.updateOverallProgress();

    // Update user's onboarding progress percentage
    await User.findByIdAndUpdate(employeeId, {
      onboardingProgress: progress.overallProgress,
    });

    // Save changes
    await progress.save();

    logger.info(
      `Updated task status for employee ${employeeId}, phase ${phase}, task ${taskId}`
    );

    return { progress, phaseCompleted };
  } catch (error) {
    logger.error(`Error updating task status: ${error.message}`);
    throw error;
  }
};

/**
 * Get onboarding progress with details
 * @param {string} employeeId - Employee ID
 * @returns {Promise<Object>} Detailed onboarding progress
 */
const getDetailedProgress = async (employeeId) => {
  try {
    const progress = await EmployeeProgress.findOne({ employeeId });

    if (!progress) {
      throw new AppError("Onboarding progress not found", 404);
    }

    const employee = await User.findById(employeeId);

    // Calculate days in program
    const daysInProgram = Math.ceil(
      (new Date() - new Date(progress.startDate)) / (1000 * 60 * 60 * 24)
    );

    // Calculate estimated completion date if not completed
    let estimatedCompletionDate = null;

    if (progress.status !== "completed" && progress.overallProgress > 0) {
      const daysPerPercent = daysInProgram / progress.overallProgress;
      const daysRemaining = daysPerPercent * (100 - progress.overallProgress);

      estimatedCompletionDate = new Date();
      estimatedCompletionDate.setDate(
        estimatedCompletionDate.getDate() + daysRemaining
      );
    }

    // Return detailed progress
    return {
      employee: {
        id: employee._id,
        name: employee.fullName,
        email: employee.email,
        department: employee.department,
        programType: employee.programType,
        startDate: employee.startDate,
      },
      progress: {
        currentPhase: progress.currentPhase,
        overallProgress: progress.overallProgress,
        startDate: progress.startDate,
        estimatedCompletionDate,
        actualCompletionDate: progress.actualCompletionDate,
        status: progress.status,
        daysInProgram,
        phases: progress.progress,
      },
    };
  } catch (error) {
    logger.error(`Error getting detailed progress: ${error.message}`);
    throw error;
  }
};

module.exports = {
  initializeOnboarding,
  updateTaskStatus,
  getDetailedProgress,
};
