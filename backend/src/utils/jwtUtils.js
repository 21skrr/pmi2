const jwt = require("jsonwebtoken");

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} secret - JWT secret
 * @param {Object} options - Token options
 * @returns {string} JWT token
 */
const generateToken = (
  payload,
  secret = process.env.JWT_SECRET,
  options = {}
) => {
  return jwt.sign(payload, secret, {
    expiresIn: options.expiresIn || process.env.JWT_EXPIRES_IN || "30d",
  });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @param {string} secret - JWT secret
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken,
};
