let express = require("express");
let router = express.Router();
let serviceController = require("../controllers/services");
let { CheckLogin, checkRole } = require("../utils/authHandler");


router.get("/", async function (req, res) {
  try {
    const services = await serviceController.GetAllActiveServices();
    res.send({
      success: true,
      message: "Lấy danh sách dịch vụ thành công.",
      data: services,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});


router.get("/pet-type/:petTypeId", async function (req, res) {
  try {
    let services = await serviceController.GetServicesByPetType(
      req.params.petTypeId,
    );
    res.send({ success: true, data: services });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});
module.exports = router;