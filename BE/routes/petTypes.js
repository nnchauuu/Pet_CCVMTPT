let express = require("express");
let router = express.Router();
let petTypeService = require("../controllers/petTypes");

router.get("/", async function (req, res) {
  try {
    let result = await petTypeService.getActivePetTypes();
    res.status(200).json({
      success: true,
      message: "Lấy danh sách loại thú cưng thành công.",
      data: result,
    });
  } catch (e) {
    res.status(400).json({
      success: false,
      message: "Lỗi khi tải loại thú cưng: " + e.message,
    });
  }
});

module.exports = router;
