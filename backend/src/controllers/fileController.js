const File = require("../models/File");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/errorUtils");
const fs = require("fs");
const path = require("path");

/**
 * @desc    Upload a file
 * @route   POST /api/files/upload
 * @access  Private
 */
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("Please upload a file", 400);
  }

  const { category, accessibleTo, isPublic } = req.body;

  // Create file record
  const file = await File.create({
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: req.file.path,
    mimetype: req.file.mimetype,
    size: req.file.size,
    uploadedBy: req.user.id,
    category: category || "document",
    isPublic: isPublic === "true" || false,
    accessibleTo: accessibleTo ? JSON.parse(accessibleTo) : [],
  });

  res.status(201).json({
    success: true,
    data: file,
  });
});

/**
 * @desc    Get all files
 * @route   GET /api/files
 * @access  Private
 */
const getFiles = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const category = req.query.category;

  // Build query
  let query = {};

  if (category) {
    query.category = category;
  }

  // If not HR, only show files uploaded by user or accessible to user
  if (req.user.role !== "hr") {
    query.$or = [
      { uploadedBy: req.user.id },
      { accessibleTo: req.user.id },
      { isPublic: true },
    ];
  }

  // Execute query
  const files = await File.find(query)
    .populate("uploadedBy", "fullName")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Get total count
  const total = await File.countDocuments(query);

  res.status(200).json({
    success: true,
    count: files.length,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: files,
  });
});

/**
 * @desc    Get a single file
 * @route   GET /api/files/:id
 * @access  Private
 */
const getFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id).populate(
    "uploadedBy",
    "fullName"
  );

  if (!file) {
    throw new AppError("File not found", 404);
  }

  // Check access
  if (
    !file.isPublic &&
    file.uploadedBy._id.toString() !== req.user.id &&
    !file.accessibleTo.includes(req.user.id) &&
    req.user.role !== "hr"
  ) {
    throw new AppError("Not authorized to access this file", 403);
  }

  res.status(200).json({
    success: true,
    data: file,
  });
});

/**
 * @desc    Download a file
 * @route   GET /api/files/:id/download
 * @access  Private
 */
const downloadFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id);

  if (!file) {
    throw new AppError("File not found", 404);
  }

  // Check access
  if (
    !file.isPublic &&
    file.uploadedBy.toString() !== req.user.id &&
    !file.accessibleTo.includes(req.user.id) &&
    req.user.role !== "hr"
  ) {
    throw new AppError("Not authorized to access this file", 403);
  }

  const filePath = path.join(__dirname, "..", "..", file.path);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new AppError("File not found on server", 404);
  }

  res.download(filePath, file.originalName);
});

/**
 * @desc    Update file details
 * @route   PUT /api/files/:id
 * @access  Private
 */
const updateFile = asyncHandler(async (req, res) => {
  let file = await File.findById(req.params.id);

  if (!file) {
    throw new AppError("File not found", 404);
  }

  // Check ownership or HR role
  if (file.uploadedBy.toString() !== req.user.id && req.user.role !== "hr") {
    throw new AppError("Not authorized to update this file", 403);
  }

  // Update file
  file = await File.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: file,
  });
});

/**
 * @desc    Delete a file
 * @route   DELETE /api/files/:id
 * @access  Private
 */
const deleteFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id);

  if (!file) {
    throw new AppError("File not found", 404);
  }

  // Check ownership or HR role
  if (file.uploadedBy.toString() !== req.user.id && req.user.role !== "hr") {
    throw new AppError("Not authorized to delete this file", 403);
  }

  // Delete file from disk
  const filePath = path.join(__dirname, "..", "..", file.path);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Delete file record
  await file.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

module.exports = {
  uploadFile,
  getFiles,
  getFile,
  downloadFile,
  updateFile,
  deleteFile,
};
