const { AppError } = require("../utils/errorUtils");

/**
 * Role-based access control middleware factory
 * @param {Array} allowedRoles - Array of roles allowed to access the resource
 * @returns {Function} Middleware function
 */
const roleAccess = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("User not found in request", 500));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

module.exports = roleAccess;
