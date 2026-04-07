const express = require("express");
const path = require("path");
const { uploadImage } = require("../utils/uploadHandler");

const router = express.Router();

router.post("/", uploadImage.single("file"), function (req, res) {
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

router.post("/one_image", uploadImage.single("file"), function (req, res) {
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
