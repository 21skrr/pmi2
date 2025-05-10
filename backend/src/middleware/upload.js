const multer = require("multer");
const path = require("path");
const { AppError } = require("../utils/errorUtils");

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Create unique filename with original extension
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `File type not allowed. Allowed types: ${allowedFileTypes.join(", ")}`,
        400
      ),
      false
    );
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = upload;
