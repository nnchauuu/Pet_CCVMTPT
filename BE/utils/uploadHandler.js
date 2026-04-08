const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadDir = path.resolve(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || "");
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  },
});

function imageFilter(req, file, cb) {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
    return;
  }

  cb(new Error("Chỉ chấp nhận file ảnh JPG, PNG, WEBP hoặc định dạng image hợp lệ."));
}

module.exports = {
  uploadImage: multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: imageFilter,
  }),
};