<<<<<<< PBS-34-Xây-dựng-tính-năng-Thanh-toán-lịch-đặt-dịch-vụ
const express = require("express");
const router = express.Router();
const petTypeModel = require("../schemas/petTypes");

function presentPetType(petType) {
  return {
    id: petType._id.toString(),
    name: petType.name,
    description: petType.description || "",
    image: petType.image || "",
  };
}

router.get("/", async function (req, res) {
  try {
    const petTypes = await petTypeModel
      .find({ isDeleted: false, isActive: true })
      .sort({ name: 1 });

    res.send({
      success: true,
      data: petTypes.map(presentPetType),
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

=======
let express = require("express");
let router = express.Router();
let petTypeService = require('../controllers/petTypes');


router.get("/", async function (req, res) {
    try {
        let result = await petTypeService.getActivePetTypes();
        res.status(200).json({ success: true, message: "Lấy danh sách loại thú cưng thành công.", data: result });
    } catch (e) {
        res.status(400).json({ success: false, message: "Lỗi khi tải loại thú cưng: " + e.message });
    }
});
>>>>>>> dev
module.exports = router;