/**
 * Application constants
 */

// User roles
const ROLES = {
  EMPLOYEE: "employee",
  SUPERVISOR: "supervisor",
  MANAGER: "manager",
  HR: "hr",
};

// User status
const USER_STATUS = {
  ACTIVE: "active",
  UNDER_REVIEW: "under_review",
  INTEGRATED: "integrated",
};

// Onboarding stages
const ONBOARDING_STAGES = {
  PREPARE: "prepare",
  ORIENT: "orient",
  LAND: "land",
  INTEGRATE: "integrate",
  EXCEL: "excel",
};

// Program types
const PROGRAM_TYPES = {
  INKOMPASS: "inkompass",
  EARLY_TALENT: "earlyTalent",
  APPRENTICESHIP: "apprenticeship",
  ACADEMIC_PLACEMENT: "academicPlacement",
  WORK_EXPERIENCE: "workExperience",
};

// Task priority levels
const TASK_PRIORITIES = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

// Event types
const EVENT_TYPES = {
  MEETING: "meeting",
  TRAINING: "training",
  EVENT: "event",
};

// Feedback types
const FEEDBACK_TYPES = {
  THREE_MONTH: "3-month",
  SIX_MONTH: "6-month",
  TWELVE_MONTH: "12-month",
  GENERAL: "general",
};

// Evaluation types
const EVALUATION_TYPES = {
  FIELD: "field",
  PROBATION: "probation",
  PERIODIC: "periodic",
  TRAINING: "training",
};

// Notification types
const NOTIFICATION_TYPES = {
  INFO: "info",
  WARNING: "warning",
  SUCCESS: "success",
  ERROR: "error",
};

module.exports = {
  ROLES,
  USER_STATUS,
  ONBOARDING_STAGES,
  PROGRAM_TYPES,
  TASK_PRIORITIES,
  EVENT_TYPES,
  FEEDBACK_TYPES,
  EVALUATION_TYPES,
  NOTIFICATION_TYPES,
};
