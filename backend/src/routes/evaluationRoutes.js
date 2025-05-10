const express = require("express");
const {
  getEvaluations,
  getEvaluation,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
} = require("../controllers/evaluationController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// Protect all routes
router.use(authenticate);

// Evaluation routes
router.post("/", authorize(["hr", "supervisor"]), createEvaluation);
router.get("/:employeeId", getEvaluations);
router.get("/item/:id", getEvaluation);
router.put("/:id", updateEvaluation);
router.delete("/:id", authorize(["hr"]), deleteEvaluation);

module.exports = router;
