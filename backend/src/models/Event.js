const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
    },
    type: {
      type: String,
      enum: {
        values: ["meeting", "training", "event"],
        message: "Type must be: meeting, training, or event",
      },
      required: [true, "Event type is required"],
    },
    location: {
      type: String,
      trim: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Organizer is required"],
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isVirtual: {
      type: Boolean,
      default: false,
    },
    meetingLink: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number, // Duration in minutes
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster querying
eventSchema.index({ date: 1 });
eventSchema.index({ participants: 1 });

module.exports = mongoose.model("Event", eventSchema);
