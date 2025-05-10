const express = require("express");
const {
  getEmployeeDashboard,
  getHRDashboard,
  getManagerDashboard,
  getSupervisorDashboard,
} = require("../controllers/dashboardController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Protect all routes
router.use(authenticate);

// Dashboard routes
router.get("/employee", authorize(["employee"]), getEmployeeDashboard);
router.get("/hr", authorize(["hr"]), getHRDashboard);
router.get("/manager", authorize(["manager"]), getManagerDashboard);
router.get("/supervisor", authorize(["supervisor"]), getSupervisorDashboard);

module.exports = router;
