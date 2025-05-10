const express = require("express");
const {
  uploadFile,
  getFiles,
  getFile,
  downloadFile,
  updateFile,
  deleteFile,
} = require("../controllers/fileController");
const { authenticate } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// Protect all routes
router.use(authenticate);

// File routes
router.post("/upload", upload.single("file"), uploadFile);
router.get("/", getFiles);
router.get("/:id", getFile);
router.get("/:id/download", downloadFile);
router.put("/:id", updateFile);
router.delete("/:id", deleteFile);

module.exports = router;
