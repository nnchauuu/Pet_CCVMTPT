const express = require("express");
const path = require("path");
const { uploadImage } = require("../utils/uploadHandler");

const router = express.Router();

function handleUploadError(error, res) {
  if (!error) return false;

  if (error.code === "LIMIT_FILE_SIZE") {
    res.status(400).send({
      success: false,
      message: "Ảnh thú cưng phải nhỏ hơn 2MB.",
    });
    return true;
  }

  res.status(400).send({
    success: false,
    message: error.message || "Không thể tải ảnh lên.",
  });
  return true;
}

function singleImageUpload(req, res, next) {
  uploadImage.single("file")(req, res, function (error) {
    if (handleUploadError(error, res)) {
      return;
    }
    next();
  });
}

router.post("/", singleImageUpload, function (req, res) {
  if (!req.file) {
    return res.status(400).send({
      success: false,
      message: "File không được để trống",
    });
  }

  res.send({
    success: true,
    message: "Upload thành công",
    data: `/uploads/${req.file.filename}`,
  });
});

router.post("/one_image", singleImageUpload, function (req, res) {
  if (!req.file) {
    return res.status(400).send({
      success: false,
      message: "Vui lòng chọn ảnh để tải lên.",
    });
  }

  res.send({
    success: true,
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`,
    size: req.file.size,
  });
});

router.get("/:filename", function (req, res) {
  res.sendFile(path.join(__dirname, "../uploads", req.params.filename));
});

module.exports = router;
