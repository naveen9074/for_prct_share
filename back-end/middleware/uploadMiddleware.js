// backend/middleware/uploadMiddleware.js
const multer = require("multer");
const path = require("path");

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// File type validation
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);

  if (ext && mime) cb(null, true);
  else cb(new Error("Only jpg/jpeg/png images allowed"), false);
};

// Create Multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

// EXPORT AS A DEFAULT FUNCTION
module.exports = upload;
