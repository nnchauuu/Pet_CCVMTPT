<<<<<<< PBS-34-Xây-dựng-tính-năng-Thanh-toán-lịch-đặt-dịch-vụ
const express = require("express");
const router = express.Router();
const serviceModel = require("../schemas/services");

function presentService(service) {
  return {
    id: service._id.toString(),
    name: service.name,
    description: service.description || "",
    price: Number(service.price || 0),
    durationInMinutes: Number(service.durationInMinutes || 0),
    imageUrl: service.imageUrl || "",
    petTypes: (service.petTypes || []).map((item) => item.toString()),
  };
}

router.get("/", async function (req, res) {
  try {
    const services = await serviceModel
      .find({ isDeleted: false, isActive: true })
      .sort({ createdAt: -1 });

    res.send({
      success: true,
      data: services.map(presentService),
=======
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
>>>>>>> dev
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

<<<<<<< PBS-34-Xây-dựng-tính-năng-Thanh-toán-lịch-đặt-dịch-vụ
=======

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
>>>>>>> dev
module.exports = router;