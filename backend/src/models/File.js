const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: [true, "Filename is required"],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, "Original name is required"],
      trim: true,
    },
    path: {
      type: String,
      required: [true, "File path is required"],
      trim: true,
    },
    mimetype: {
      type: String,
      required: [true, "MIME type is required"],
      trim: true,
    },
    size: {
      type: Number,
      required: [true, "File size is required"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploaded by is required"],
    },
    category: {
      type: String,
      enum: {
        values: ["document", "image", "policy", "contract", "other"],
        message:
          "Category must be: document, image, policy, contract, or other",
      },
      default: "document",
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    accessibleTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster querying
// Indexes for faster querying
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ category: 1 });

// Virtual for file URL
fileSchema.virtual("url").get(function () {
  return `/uploads/${this.filename}`;
});

module.exports = mongoose.model("File", fileSchema);
