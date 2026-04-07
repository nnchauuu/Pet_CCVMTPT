const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
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