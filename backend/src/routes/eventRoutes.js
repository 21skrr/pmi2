const express = require("express");
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// Protect all routes
router.use(authenticate);

// Event routes
router.route("/").get(getEvents).post(createEvent);

router.route("/:id").get(getEvent).put(updateEvent).delete(deleteEvent);

module.exports = router;
