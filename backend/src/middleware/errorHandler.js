const logger = require("../config/logger");
const { AppError } = require("../utils/errorUtils");

/**
 * Custom error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error(`${err.name}: ${err.message}`);

  // Default error
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new AppError(messages.join(", "), 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new AppError(
      `Duplicate field value: ${field}. Please use another value.`,
      400
    );
  }

  // Mongoose cast error
  if (err.name === "CastError") {
    error = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid token. Please log in again.", 401);
  }

  if (err.name === "TokenExpiredError") {
    error = new AppError("Your token has expired. Please log in again.", 401);
  }

  // Send error response
  res.status(error.statusCode).json({
    success: false,
    error: {
      message: error.message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
};

module.exports = errorHandler;
