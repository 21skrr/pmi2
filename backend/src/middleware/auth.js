const passport = require("passport");
const { AppError } = require("../utils/errorUtils");

/**
 * Authentication middleware using JWT strategy
 */
const authenticate = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      return next(new AppError("Authentication error", 500));
    }

    if (!user) {
      return next(new AppError("Not authenticated. Please log in.", 401));
    }

    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Role-based authorization middleware
 * @param {Array} roles - Allowed roles
 */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

/**
 * Check if user is accessing their own resource or has admin privileges
 * @param {String} paramIdField - Request parameter containing the user ID
 */
const authorizeOwner = (paramIdField = "id") => {
  return (req, res, next) => {
    const resourceId = req.params[paramIdField];
    const isOwner = req.user.id === resourceId;
    const isAdmin = req.user.role === "hr";

    if (!isOwner && !isAdmin) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  authorizeOwner,
};
