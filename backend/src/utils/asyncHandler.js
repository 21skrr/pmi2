/**
 * Wraps async controller functions to avoid try/catch blocks
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = { asyncHandler };
