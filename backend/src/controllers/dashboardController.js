const User = require("../../../src/models/User");
const Task = require("../../../src/models/Task");
const Event = require("../../../src/models/Event");
const EmployeeProgress = require("../../../src/models/EmployeeProgress");
const Feedback = require("../../../src/models/Feedback");
const Evaluation = require("../../../src/models/Evaluation");
const { asyncHandler } = require("../../../src/utils/asyncHandler");
const { AppError } = require("../../../src/utils/errorUtils");

/**
 * @desc    Get employee dashboard data
 * @route   GET /api/dashboard/employee
 * @access  Private (Employee only)
 */
const getEmployeeDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get tasks
  const tasks = await Task.find({
    employeeId: userId,
    isCompleted: false,
  })
    .sort({ dueDate: 1 })
    .limit(5);

  // Get events
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = await Event.find({
    participants: userId,
    date: { $gte: today },
  })
    .sort({ date: 1 })
    .limit(5);

  // Get onboarding progress
  const onboardingProgress = await EmployeeProgress.findOne({
    employeeId: userId,
  });

  // Training courses (using simplified version since Course model wasn't fully implemented)
  const courses = [
    {
      id: 1,
      title: "Introduction to PMI",
      progress: 75,
      modulesCompleted: 3,
      totalModules: 4,
    },
    {
      id: 2,
      title: "Orientation Training",
      progress: 100,
      modulesCompleted: 5,
      totalModules: 5,
    },
    {
      id: 3,
      title: "IT Security Essentials",
      progress: 50,
      modulesCompleted: 2,
      totalModules: 4,
    },
  ];

  res.status(200).json({
    success: true,
    data: {
      tasks,
      events,
      onboardingProgress,
      courses,
    },
  });
});

/**
 * @desc    Get HR dashboard data
 * @route   GET /api/dashboard/hr
 * @access  Private (HR only)
 */
const getHRDashboard = asyncHandler(async (req, res) => {
  // Get active employees count
  const activeEmployees = await User.countDocuments({
    role: "employee",
    status: "active",
  });

  // Get onboarding metrics
  const pendingOnboarding = await EmployeeProgress.countDocuments({
    status: "in_progress",
  });

  // Get completions this month
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const completedThisMonth = await EmployeeProgress.countDocuments({
    status: "completed",
    actualCompletionDate: { $gte: firstDayOfMonth },
  });

  // Get retention rate (mock data for now)
  const retentionRate = 92;

  // Get program distribution
  const programCounts = await User.aggregate([
    { $match: { role: "employee" } },
    { $group: { _id: "$programType", count: { $sum: 1 } } },
  ]);

  const programColors = {
    inkompass: "bg-blue-500",
    earlyTalent: "bg-green-500",
    apprenticeship: "bg-yellow-500",
    academicPlacement: "bg-purple-500",
    workExperience: "bg-red-500",
  };

  const programDistribution = programCounts.map((program) => ({
    program: program._id || "uncategorized",
    count: program.count,
    color: programColors[program._id] || "bg-gray-500",
  }));

  // Get attention items
  // These are tasks, evaluations that are overdue or pending

  // Overdue tasks
  const overdueTasks = await Task.find({
    isCompleted: false,
    dueDate: { $lt: new Date() },
  })
    .populate("employeeId", "fullName")
    .limit(5);

  // Pending evaluations
  const pendingEvaluations = await Evaluation.find({
    status: "pending",
    dueDate: { $lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // Due within a week
  })
    .populate("employeeId", "fullName")
    .limit(5);

  // Format attention items
  const attentionItems = [
    ...overdueTasks.map((task) => ({
      id: task._id,
      type: "task",
      employee: task.employeeId.fullName,
      dueDate: task.dueDate.toISOString().split("T")[0],
      status: "overdue",
      description: `Overdue task: ${task.title}`,
    })),
    ...pendingEvaluations.map((evaluation) => ({
      // Change 'eval' to 'evaluation'
      id: evaluation._id, // Change 'eval' to 'evaluation'
      type: "evaluation",
      employee: evaluation.employeeId.fullName, // Change 'eval' to 'evaluation'
      dueDate: evaluation.dueDate.toISOString().split("T")[0], // Change 'eval' to 'evaluation'
      status: evaluation.dueDate < new Date() ? "overdue" : "pending",
      description: `${evaluation.type} evaluation needs completion`, // Change 'eval' to 'evaluation'
    })),
  ];

  // Get recent activities
  // This would typically come from the Activity model
  // Mocking for now
  const recentActivities = [
    {
      id: "1",
      activity: "New employee onboarded",
      details: "John Employee has completed the orientation phase",
      date: "2024-03-10",
      time: "09:15 AM",
    },
    {
      id: "2",
      activity: "Evaluation completed",
      details: "Sarah Supervisor completed 3-month evaluation for Alex Intern",
      date: "2024-03-09",
      time: "02:30 PM",
    },
    {
      id: "3",
      activity: "Feedback submitted",
      details: "Maria Manager provided feedback for the Inkompass program",
      date: "2024-03-08",
      time: "11:45 AM",
    },
  ];

  res.status(200).json({
    success: true,
    data: {
      hrMetrics: {
        activeEmployees,
        pendingOnboarding,
        completedThisMonth,
        retentionRate,
        programDistribution,
      },
      attentionItems,
      recentActivities,
    },
  });
});

/**
 * @desc    Get Manager dashboard data
 * @route   GET /api/dashboard/manager
 * @access  Private (Manager only)
 */
const getManagerDashboard = asyncHandler(async (req, res) => {
  const { department } = req.user;

  // Get team overview
  const totalEmployees = await User.countDocuments({
    department,
    role: "employee",
  });

  const inOnboarding = await User.countDocuments({
    department,
    role: "employee",
    onboardingProgress: { $lt: 100 },
  });

  const completedOnboarding = totalEmployees - inOnboarding;

  // Get program distribution
  const programCounts = await User.aggregate([
    { $match: { department, role: "employee" } },
    { $group: { _id: "$programType", count: { $sum: 1 } } },
  ]);

  const programColors = {
    inkompass: "bg-blue-500",
    earlyTalent: "bg-green-500",
    apprenticeship: "bg-yellow-500",
    academicPlacement: "bg-purple-500",
    workExperience: "bg-red-500",
  };

  const programDistribution = programCounts.map((program) => ({
    program: program._id || "uncategorized",
    count: program.count,
    color: programColors[program._id] || "bg-gray-500",
  }));

  // Get pending reviews
  const pendingReviews = await Evaluation.find({
    status: "pending",
    employeeId: { $in: await User.find({ department }).select("_id") },
  })
    .populate("employeeId", "fullName")
    .populate("supervisorId", "fullName")
    .select("id employeeId supervisorId type dueDate")
    .sort({ dueDate: 1 })
    .limit(5);

  const formattedReviews = pendingReviews.map((review) => ({
    id: review._id,
    employeeName: review.employeeId.fullName,
    evaluationType: review.type,
    dueDate: review.dueDate.toISOString().split("T")[0],
    supervisorName: review.supervisorId.fullName,
  }));

  // Get upcoming events
  const today = new Date();
  const events = await Event.find({
    date: { $gte: today },
    $or: [
      { organizer: req.user.id },
      { participants: { $in: await User.find({ department }).select("_id") } },
    ],
  })
    .sort({ date: 1 })
    .limit(5);

  const formattedEvents = events.map((event) => ({
    id: event._id,
    title: event.title,
    date: event.date,
    type: event.type,
  }));

  // Get performance metrics
  const metrics = [
    {
      category: "Onboarding Time",
      value: 25,
      target: 30,
      unit: " days",
    },
    {
      category: "Training Completion",
      value: 87,
      target: 90,
      unit: "%",
    },
    {
      category: "Feedback Submission",
      value: 92,
      target: 85,
      unit: "%",
    },
    {
      category: "Employee Satisfaction",
      value: 4.3,
      target: 4.0,
      unit: "/5",
    },
  ];

  res.status(200).json({
    success: true,
    data: {
      teamOverview: {
        totalEmployees,
        inOnboarding,
        completedOnboarding,
        programDistribution,
      },
      pendingReviews: formattedReviews,
      upcomingEvents: formattedEvents,
      performanceMetrics: metrics,
    },
  });
});

/**
 * @desc    Get Supervisor dashboard data
 * @route   GET /api/dashboard/supervisor
 * @access  Private (Supervisor only)
 */
const getSupervisorDashboard = asyncHandler(async (req, res) => {
  // Get supervised employees
  const teamMembers = await User.find({
    assignedSupervisor: req.user.id,
    role: "employee",
  });

  const teamMemberIds = teamMembers.map((member) => member._id);

  // Get team metrics
  const newCount = teamMembers.filter(
    (member) => member.onboardingProgress < 30
  ).length;

  const completingCount = teamMembers.filter(
    (member) =>
      member.onboardingProgress >= 70 && member.onboardingProgress < 100
  ).length;

  // Get average onboarding progress
  const totalProgress = teamMembers.reduce(
    (acc, member) => acc + (member.onboardingProgress || 0),
    0
  );

  const avgProgress =
    teamMembers.length > 0 ? Math.round(totalProgress / teamMembers.length) : 0;

  // Get evaluation completion rate
  const totalEvaluations = await Evaluation.countDocuments({
    supervisorId: req.user.id,
  });

  const completedEvaluations = await Evaluation.countDocuments({
    supervisorId: req.user.id,
    status: "completed",
  });

  const evaluationRate =
    totalEvaluations > 0
      ? Math.round((completedEvaluations / totalEvaluations) * 100)
      : 100;

  // Get upcoming events
  const today = new Date();
  const events = await Event.find({
    date: { $gte: today },
    $or: [
      { organizer: req.user.id },
      { participants: req.user.id },
      { participants: { $in: teamMemberIds } },
    ],
  })
    .sort({ date: 1 })
    .limit(5);

  // Format team members data
  const formattedTeamMembers = await Promise.all(
    teamMembers.map(async (member) => {
      const progress = await EmployeeProgress.findOne({
        employeeId: member._id,
      });
      const daysInProgram = progress
        ? Math.ceil(
            (Date.now() - new Date(progress.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

      return {
        id: member._id,
        name: member.fullName,
        role: member.department,
        program: member.programType,
        stage: member.onboardingStage,
        progress: member.onboardingProgress || 0,
        daysInProgram,
        avatar: `https://randomuser.me/api/portraits/${
          Math.random() > 0.5 ? "men" : "women"
        }/${Math.floor(Math.random() * 100)}.jpg`,
      };
    })
  );

  // Get pending evaluations
  const evaluations = await Evaluation.find({
    supervisorId: req.user.id,
    status: "pending",
  })
    .populate("employeeId", "fullName")
    .sort({ dueDate: 1 });

  const formattedEvaluations = evaluations.map((evaluation) => ({
    id: evaluation._id,
    employeeName: evaluation.employeeId.fullName,
    employeeId: evaluation.employeeId._id,
    type: evaluation.type,
    dueDate: evaluation.dueDate.toISOString().split("T")[0],
  }));

  res.status(200).json({
    success: true,
    data: {
      teamMembers: formattedTeamMembers,
      pendingEvaluations: formattedEvaluations,
      upcomingEvents: events,
      metrics: {
        newCount,
        completingCount,
        onboardingProgress: avgProgress,
        evaluationRate,
        feedback: [
          { label: "Communication", value: 85 },
          { label: "Technical Skills", value: 78 },
          { label: "Teamwork", value: 92 },
          { label: "Initiative", value: 81 },
        ],
      },
    },
  });
});

module.exports = {
  getEmployeeDashboard,
  getHRDashboard,
  getManagerDashboard,
  getSupervisorDashboard,
};
