const Event = require("../models/Event");
const User = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/errorUtils");
const Activity = require("../models/Activity");
const Notification = require("../models/Notification");

/**
 * @desc    Get events
 * @route   GET /api/events
 * @access  Private
 */
const getEvents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
  const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
  const type = req.query.type;

  // Build query
  let query = {};

  // Date range filter
  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate };
  } else if (startDate) {
    query.date = { $gte: startDate };
  } else if (endDate) {
    query.date = { $lte: endDate };
  }

  // Type filter
  if (type) {
    query.type = type;
  }

  // If not HR or manager, only show events where user is participant or organizer
  if (req.user.role !== "hr" && req.user.role !== "manager") {
    query.$or = [{ organizer: req.user.id }, { participants: req.user.id }];
  }

  // Execute query
  const events = await Event.find(query)
    .populate("organizer", "fullName email")
    .sort({ date: 1 })
    .skip(skip)
    .limit(limit);

  // Get total count
  const total = await Event.countDocuments(query);

  res.status(200).json({
    success: true,
    count: events.length,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: events,
  });
});

/**
 * @desc    Get a single event
 * @route   GET /api/events/:id
 * @access  Private
 */
const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate("organizer", "fullName email")
    .populate("participants", "fullName email");

  if (!event) {
    throw new AppError("Event not found", 404);
  }

  // Check authorization
  if (
    req.user.role !== "hr" &&
    req.user.role !== "manager" &&
    event.organizer._id.toString() !== req.user.id &&
    !event.participants.some((p) => p._id.toString() === req.user.id)
  ) {
    throw new AppError("Not authorized to access this event", 403);
  }

  res.status(200).json({
    success: true,
    data: event,
  });
});

/**
 * @desc    Create an event
 * @route   POST /api/events
 * @access  Private
 */
const createEvent = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    date,
    type,
    location,
    participants,
    isVirtual,
    meetingLink,
    duration,
  } = req.body;

  // Validate participants
  if (participants && participants.length > 0) {
    const userIds = await User.find({ _id: { $in: participants } }).select(
      "_id"
    );
    if (userIds.length !== participants.length) {
      throw new AppError("One or more participants not found", 400);
    }
  }

  // Create event
  const event = await Event.create({
    title,
    description,
    date,
    type: type || "meeting",
    location,
    organizer: req.user.id,
    participants: participants || [],
    isVirtual: isVirtual || false,
    meetingLink,
    duration,
  });

  // Notify participants
  if (participants && participants.length > 0) {
    const notifications = participants.map((userId) => ({
      userId,
      title: "New Event",
      message: `You have been invited to: ${title}`,
      type: "info",
      relatedEntity: "event",
      relatedEntityId: event._id,
    }));

    await Notification.insertMany(notifications);
  }

  // Log activity
  await Activity.create({
    user: req.user.id,
    action: "Event created",
    details: `${req.user.fullName} created event "${title}"`,
    entityType: "event",
    entityId: event._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(201).json({
    success: true,
    data: event,
  });
});

/**
 * @desc    Update an event
 * @route   PUT /api/events/:id
 * @access  Private
 */
const updateEvent = asyncHandler(async (req, res) => {
  let event = await Event.findById(req.params.id);

  if (!event) {
    throw new AppError("Event not found", 404);
  }

  // Check authorization
  if (req.user.id !== event.organizer.toString() && req.user.role !== "hr") {
    throw new AppError("Not authorized to update this event", 403);
  }

  // Validate participants
  if (req.body.participants && req.body.participants.length > 0) {
    const userIds = await User.find({
      _id: { $in: req.body.participants },
    }).select("_id");
    if (userIds.length !== req.body.participants.length) {
      throw new AppError("One or more participants not found", 400);
    }
  }

  // Get original participants for notification
  const oldParticipants = [...event.participants];

  // Update event
  event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // Notify new participants
  if (req.body.participants) {
    const newParticipants = req.body.participants.filter(
      (p) => !oldParticipants.some((op) => op.toString() === p.toString())
    );

    if (newParticipants.length > 0) {
      const notifications = newParticipants.map((userId) => ({
        userId,
        title: "New Event Invitation",
        message: `You have been invited to: ${event.title}`,
        type: "info",
        relatedEntity: "event",
        relatedEntityId: event._id,
      }));

      await Notification.insertMany(notifications);
    }
  }

  // Notify all participants about update
  if (req.body.date || req.body.location || req.body.title) {
    const participants = event.participants.filter(
      (p) => p.toString() !== req.user.id
    );

    if (participants.length > 0) {
      const notifications = participants.map((userId) => ({
        userId,
        title: "Event Updated",
        message: `Event "${event.title}" has been updated`,
        type: "info",
        relatedEntity: "event",
        relatedEntityId: event._id,
      }));

      await Notification.insertMany(notifications);
    }
  }

  // Log activity
  await Activity.create({
    user: req.user.id,
    action: "Event updated",
    details: `${req.user.fullName} updated event "${event.title}"`,
    entityType: "event",
    entityId: event._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    data: event,
  });
});

/**
 * @desc    Delete an event
 * @route   DELETE /api/events/:id
 * @access  Private
 */
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    throw new AppError("Event not found", 404);
  }

  // Check authorization
  if (req.user.id !== event.organizer.toString() && req.user.role !== "hr") {
    throw new AppError("Not authorized to delete this event", 403);
  }

  await event.deleteOne();

  // Notify participants
  const participants = event.participants.filter(
    (p) => p.toString() !== req.user.id
  );

  if (participants.length > 0) {
    const notifications = participants.map((userId) => ({
      userId,
      title: "Event Cancelled",
      message: `Event "${event.title}" has been cancelled`,
      type: "info",
      relatedEntity: "event",
      relatedEntityId: event._id,
    }));

    await Notification.insertMany(notifications);
  }

  // Log activity
  await Activity.create({
    user: req.user.id,
    action: "Event deleted",
    details: `${req.user.fullName} deleted event "${event.title}"`,
    entityType: "event",
    entityId: event._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

module.exports = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
};
