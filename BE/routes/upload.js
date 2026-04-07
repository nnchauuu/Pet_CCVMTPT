const express = require("express");
const path = require("path");
const { uploadImage } = require("../utils/uploadHandler");

const router = express.Router();

router.post("/one_image", function (req, res, next) {
  uploadImage.single("file")(req, res, function (error) {
    if (error) {
      return res.status(400).send({
        success: false,
        message: error.message || "Không thể tải ảnh thú cưng.",
      });
    }

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
});

router.get("/:filename", function (req, res) {
  res.sendFile(path.join(__dirname, "../uploads", req.params.filename));
});

module.exports = router;