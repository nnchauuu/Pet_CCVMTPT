const express = require("express");
const router = express.Router();
const petModel = require("../schemas/pets");
const petTypeModel = require("../schemas/petTypes");
const { CheckLogin } = require("../utils/authHandler");
let petController = require('../controllers/pets');
function ensureSameUser(req, res) {
  if (String(req.user.id) !== String(req.params.userId)) {
    res.status(403).send({
      success: false,
      message: "Bạn không có quyền truy cập dữ liệu này.",
    });
    return false;
  }
  return true;
}

function presentPet(pet) {
  const petType = pet.petType && typeof pet.petType === "object" ? pet.petType : null;
  return {
    id: pet._id.toString(),
    mongoId: pet._id.toString(),
    name: pet.name,
    age: Number(pet.age || 0),
    imageUrl: pet.imageUrl || "",
    petTypeId: petType ? petType._id.toString() : pet.petType?.toString() || null,
    petTypeName: petType ? petType.name : "",
  };
}

router.get("/user/:userId", CheckLogin, async function (req, res) {
  if (!ensureSameUser(req, res)) return;

  try {
    const pets = await petModel
      .find({ user: req.user.id, isDeleted: false })
      .populate("petType")
      .sort({ createdAt: -1 });

    res.send({
      success: true,
      data: pets.map(presentPet),
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

router.post("/user/:userId", CheckLogin, async function (req, res) {
  if (!ensureSameUser(req, res)) return;

  try {
    const petType = await petTypeModel.findOne({
      _id: req.body.petTypeId,
      isDeleted: false,
      isActive: true,
    });

    if (!petType) {
      return res.status(400).send({
        success: false,
        message: "Loại thú cưng không hợp lệ.",
      });
    }

    const pet = await petModel.create({
      name: req.body.name,
      age: Number(req.body.age || 0),
      imageUrl: req.body.imageUrl || "",
      user: req.user.id,
      petType: petType._id,
    });

    await pet.populate("petType");

    res.send({
      success: true,
      data: presentPet(pet),
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});
router.post("/", async function (req, res) {
    let pet = await petController.CreatePet(
        req.body.user,
        req.body.name,
        req.body.petType,
        req.body.age
    );
    if (!pet) return res.status(400).send({ success: false, message: "Lỗi tạo thú cưng" });
    res.send({ success: true, data: pet });
});
router.get("/userPets/:userId", async function (req, res) {
    let pets = await petController.GetPetsByUser(req.params.userId);
    res.send({ success: true, data: pets });
});
module.exports = router;