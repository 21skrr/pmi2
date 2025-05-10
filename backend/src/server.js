// src/server.js
console.log("Starting server...");
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/pmi_onboarding"
    );
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

// Define simplified models to match frontend

// User model
const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["employee", "supervisor", "manager", "hr"],
      required: true,
    },
    department: { type: String },
    programType: { type: String },
    onboardingStage: { type: String, default: "prepare" },
    onboardingProgress: { type: Number, default: 0 },
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// Task model
const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueDate: { type: Date, required: true },
    isCompleted: { type: Boolean, default: false },
    priority: { type: String, default: "medium" },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

// Event model
const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    date: { type: Date, required: true },
    type: {
      type: String,
      enum: ["meeting", "training", "event"],
      default: "meeting",
    },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);

// Course model
const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    progress: { type: Number, default: 0 },
    modulesCompleted: { type: Number, default: 0 },
    totalModules: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);

// Authentication routes
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // For demo purposes, use predefined users
    if (email === "employee@pmi.com" && password === "password") {
      const token = jwt.sign(
        { id: "1", role: "employee" },
        process.env.JWT_SECRET || "your_jwt_secret"
      );

      return res.json({
        token,
        user: {
          id: "1",
          name: "John Employee",
          email: "employee@pmi.com",
          role: "employee",
          department: "Marketing",
          programType: "earlyTalent",
          onboardingStage: "land",
          onboardingProgress: 65,
        },
      });
    }

    if (email === "hr@pmi.com" && password === "password") {
      const token = jwt.sign(
        { id: "3", role: "hr" },
        process.env.JWT_SECRET || "your_jwt_secret"
      );

      return res.json({
        token,
        user: {
          id: "3",
          name: "Maria HR",
          email: "hr@pmi.com",
          role: "hr",
          department: "Human Resources",
        },
      });
    }

    if (email === "supervisor@pmi.com" && password === "password") {
      const token = jwt.sign(
        { id: "2", role: "supervisor" },
        process.env.JWT_SECRET || "your_jwt_secret"
      );

      return res.json({
        token,
        user: {
          id: "2",
          name: "Sarah Supervisor",
          email: "supervisor@pmi.com",
          role: "supervisor",
          department: "Operations",
        },
      });
    }

    if (email === "manager@pmi.com" && password === "password") {
      const token = jwt.sign(
        { id: "4", role: "manager" },
        process.env.JWT_SECRET || "your_jwt_secret"
      );

      return res.json({
        token,
        user: {
          id: "4",
          name: "Tom Manager",
          email: "manager@pmi.com",
          role: "manager",
          department: "Product Development",
        },
      });
    }

    return res.status(401).json({ error: "Invalid credentials" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get current user
app.get("/api/auth/me", async (req, res) => {
  // This would typically verify JWT token
  // Simplified for demo
  res.json({
    id: "1",
    name: "John Employee",
    email: "employee@pmi.com",
    role: "employee",
  });
});

// Tasks API
app.get("/tasks", async (req, res) => {
  try {
    // Mock data for tasks
    const tasks = [
      {
        id: 1,
        title: "Complete onboarding paperwork",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: false,
        priority: "high",
      },
      {
        id: 2,
        title: "Schedule meeting with supervisor",
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: true,
        priority: "medium",
      },
      {
        id: 3,
        title: "Review company policies",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: false,
        priority: "medium",
      },
    ];

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Events API
app.get("/events", async (req, res) => {
  try {
    // Mock data for events
    const events = [
      {
        id: 1,
        title: "Team Onboarding Session",
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        type: "meeting",
      },
      {
        id: 2,
        title: "Compliance Training",
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        type: "training",
      },
      {
        id: 3,
        title: "Company Picnic",
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        type: "event",
      },
    ];

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Training courses API
app.get("/trainingCourses", async (req, res) => {
  try {
    // Mock data for courses
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
        title: "Compliance Fundamentals",
        progress: 50,
        modulesCompleted: 2,
        totalModules: 4,
      },
      {
        id: 3,
        title: "Company Systems Training",
        progress: 25,
        modulesCompleted: 1,
        totalModules: 4,
      },
    ];

    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// HR Metrics API
app.get("/hrMetrics", async (req, res) => {
  try {
    const metrics = {
      activeEmployees: 150,
      pendingOnboarding: 12,
      completedThisMonth: 8,
      retentionRate: 92,
      programDistribution: [
        { program: "INKOMPASS", count: 30, color: "bg-blue-500" },
        { program: "Early Talent", count: 45, color: "bg-green-500" },
        { program: "Apprenticeship", count: 25, color: "bg-yellow-500" },
        { program: "Academic Placement", count: 15, color: "bg-purple-500" },
        { program: "Work Experience", count: 35, color: "bg-red-500" },
      ],
    };

    res.json(metrics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Attention items API
app.get("/attentionItems", async (req, res) => {
  try {
    const items = [
      {
        id: "1",
        type: "task",
        employee: "John Employee",
        dueDate: "2024-05-05",
        status: "overdue",
        description: "Overdue task: Complete compliance training",
      },
      {
        id: "2",
        type: "evaluation",
        employee: "Maria Smith",
        dueDate: "2024-05-12",
        status: "pending",
        description: "3-month evaluation needs completion",
      },
      {
        id: "3",
        type: "onboarding",
        employee: "Alex Johnson",
        dueDate: "2024-05-08",
        status: "delayed",
        description: "Onboarding process delayed at orientation phase",
      },
    ];

    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Recent activities API
app.get("/recentActivities", async (req, res) => {
  try {
    const activities = [
      {
        id: "1",
        activity: "New employee onboarded",
        details: "John Employee has completed the orientation phase",
        date: "2024-05-08",
        time: "09:15 AM",
      },
      {
        id: "2",
        activity: "Evaluation completed",
        details:
          "Sarah Supervisor completed 3-month evaluation for Alex Intern",
        date: "2024-05-07",
        time: "02:30 PM",
      },
      {
        id: "3",
        activity: "Feedback submitted",
        details: "Maria Manager provided feedback for the Inkompass program",
        date: "2024-05-06",
        time: "11:45 AM",
      },
    ];

    res.json(activities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Team Overview API
app.get("/teamOverview", async (req, res) => {
  try {
    const overview = {
      totalEmployees: 15,
      inOnboarding: 5,
      completedOnboarding: 10,
      programDistribution: [
        { program: "INKOMPASS", count: 3, color: "bg-blue-500" },
        { program: "Early Talent", count: 5, color: "bg-green-500" },
        { program: "Apprenticeship", count: 2, color: "bg-yellow-500" },
        { program: "Academic Placement", count: 1, color: "bg-purple-500" },
        { program: "Work Experience", count: 4, color: "bg-red-500" },
      ],
    };

    res.json(overview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Pending Reviews API
app.get("/pendingReviews", async (req, res) => {
  try {
    const reviews = [
      {
        id: "1",
        employeeName: "John Employee",
        evaluationType: "3-month review",
        dueDate: "2024-05-15",
        supervisorName: "Sarah Supervisor",
      },
      {
        id: "2",
        employeeName: "Maria Smith",
        evaluationType: "Probation review",
        dueDate: "2024-05-18",
        supervisorName: "Sarah Supervisor",
      },
      {
        id: "3",
        employeeName: "Alex Johnson",
        evaluationType: "Training assessment",
        dueDate: "2024-05-20",
        supervisorName: "Tom Manager",
      },
    ];

    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Manager Events API
app.get("/upcomingEvents", async (req, res) => {
  try {
    const events = [
      {
        id: "1",
        title: "Team Onboarding Session",
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        type: "meeting",
      },
      {
        id: "2",
        title: "Quarterly Planning",
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        type: "planning",
      },
      {
        id: "3",
        title: "New Hire Orientation",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        type: "event",
      },
    ];

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Performance Metrics API
app.get("/performanceMetrics", async (req, res) => {
  try {
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

    res.json(metrics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// User Onboarding API
app.get("/userOnboarding", async (req, res) => {
  try {
    const user = {
      id: "1",
      name: "John Employee",
      email: "employee@pmi.com",
      role: "employee",
      department: "Marketing",
      programType: "earlyTalent",
      onboardingStage: "land",
      onboardingProgress: 65,
    };

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Supervisor Team API
app.get("/supervisorTeam", async (req, res) => {
  try {
    const team = [
      {
        id: "1",
        name: "John Employee",
        role: "Marketing Analyst",
        program: "Early Talent",
        stage: "land",
        progress: 60,
        daysInProgram: 15,
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        id: "2",
        name: "Priya Sharma",
        role: "Junior Developer",
        program: "Apprenticeship",
        stage: "integrate",
        progress: 85,
        daysInProgram: 48,
        avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      },
      {
        id: "3",
        name: "Marco Torres",
        role: "Operations Trainee",
        program: "INKOMPASS",
        stage: "excel",
        progress: 95,
        daysInProgram: 89,
        avatar: "https://randomuser.me/api/portraits/men/67.jpg",
      },
    ];

    res.json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Supervisor Evaluations API
app.get("/supervisorEvaluations", async (req, res) => {
  try {
    const evaluations = [
      {
        id: "1",
        employeeName: "John Employee",
        employeeId: "1",
        type: "3-month",
        dueDate: "2024-05-15",
      },
      {
        id: "2",
        employeeName: "Priya Sharma",
        employeeId: "2",
        type: "probation",
        dueDate: "2024-05-20",
      },
    ];

    res.json(evaluations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Supervisor Events API
app.get("/supervisorEvents", async (req, res) => {
  try {
    const events = [
      {
        id: "1",
        title: "Team Onboarding Session",
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        attendees: 3,
      },
      {
        id: "2",
        title: "Individual Performance Review",
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        attendees: 1,
      },
    ];

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Supervisor Metrics API
app.get("/supervisorMetrics", async (req, res) => {
  try {
    const metrics = {
      newCount: 1,
      completingCount: 1,
      onboardingProgress: 80,
      evaluationRate: 90,
      feedback: [
        { label: "Communication", value: 85 },
        { label: "Technical Skills", value: 78 },
        { label: "Teamwork", value: 92 },
        { label: "Initiative", value: 81 },
      ],
    };

    res.json(metrics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "API is running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// Connect to database and start server
const PORT = process.env.PORT || 3000;

// Start server without waiting for MongoDB connection for testing
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Try to connect to MongoDB but don't halt if it fails
  connectDB().catch((err) => {
    console.error("MongoDB connection error:", err.message);
    console.log("Server running in offline mode (no database connection)");
  });
});
