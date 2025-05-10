const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const passport = require("passport");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const path = require("path");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./config/logger");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const onboardingRoutes = require("./routes/onboardingRoutes");
const taskRoutes = require("./routes/taskRoutes");
const eventRoutes = require("./routes/eventRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const evaluationRoutes = require("./routes/evaluationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const fileRoutes = require("./routes/fileRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

// Initialize Express app
const app = express();

// Security headers
app.use(helmet());

// Body parser
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Sanitize data
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// Enable CORS
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api/auth", limiter);

// Request logging
app.use(morgan("combined", { stream: logger.stream }));

// Initialize Passport
require("./config/passport")();
app.use(passport.initialize());

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Handle undefined routes
app.all("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
