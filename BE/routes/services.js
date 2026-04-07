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
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;