const express = require("express");
const router = express.Router();
const petModel = require("../schemas/pets");
const petTypeModel = require("../schemas/petTypes");
const { CheckLogin } = require("../utils/authHandler");
let petController = require('../controllers/pets');

function isAdmin(req) {
  if (!req.user) return false;
  const roleName =
    typeof req.user.role === "object"
      ? req.user.role?.name
      : req.user.role;
  return (
    roleName === "admin" ||
    roleName === "Admin" ||
    roleName === "ADMIN" ||
    req.user.isAdmin === true
  );
}

function ensureSameUserOrAdmin(req, res) {
  if (isAdmin(req)) return true;
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
  const owner = pet.user && typeof pet.user === "object" ? pet.user : null;
  return {
    id: pet._id.toString(),
    mongoId: pet._id.toString(),
    name: pet.name,
    age: Number(pet.age || 0),
    imageUrl: pet.imageUrl || "",
    petTypeId: petType ? petType._id.toString() : (pet.petType?.toString() || null),
    petTypeName: petType ? petType.name : "",
    ownerId: owner ? owner._id.toString() : (pet.user?.toString() || null),
    ownerName: owner ? (owner.username || owner.name || "") : "",
    ownerEmail: owner ? (owner.email || "") : "",
  };
}

router.get("/all", CheckLogin, async function (req, res) {
  if (!isAdmin(req)) {
    return res.status(403).send({ success: false, message: "Chỉ admin mới có quyền xem tất cả thú cưng." });
  }
  try {
    const pets = await petModel
      .find({ isDeleted: false })
      .populate("petType")
      .populate("user", "username name email")
      .sort({ createdAt: -1 });

    res.send({ success: true, data: pets.map(presentPet) });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});


router.get("/user/:userId", CheckLogin, async function (req, res) {
  if (!ensureSameUserOrAdmin(req, res)) return;

  try {
    const pets = await petModel
      .find({ user: req.params.userId, isDeleted: false })
      .populate("petType")
      .populate("user", "username name email")
      .sort({ createdAt: -1 });

    res.send({ success: true, data: pets.map(presentPet) });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});


router.post("/user/:userId", CheckLogin, async function (req, res) {
  if (!ensureSameUserOrAdmin(req, res)) return;

  try {
    const petType = await petTypeModel.findOne({
      _id: req.body.petTypeId,
      isDeleted: false,
      isActive: true,
    });

    if (!petType) {
      return res.status(400).send({ success: false, message: "Loại thú cưng không hợp lệ." });
    }

    const pet = await petModel.create({
      name: req.body.name,
      age: Number(req.body.age || 0),
      imageUrl: req.body.imageUrl || "",
      user: req.params.userId,
      petType: petType._id,
    });

    await pet.populate("petType");
    await pet.populate("user", "username name email");

    res.send({ success: true, data: presentPet(pet) });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});


router.put("/user/:userId/:petId", CheckLogin, async function (req, res) {
  if (!ensureSameUserOrAdmin(req, res)) return;

  try {
    const petType = await petTypeModel.findOne({
      _id: req.body.petTypeId,
      isDeleted: false,
      isActive: true,
    });

    if (!petType) {
      return res.status(400).send({ success: false, message: "Loại thú cưng không hợp lệ." });
    }

    const pet = await petModel.findOne({ _id: req.params.petId, isDeleted: false });
    if (!pet) {
      return res.status(404).send({ success: false, message: "Không tìm thấy thú cưng." });
    }

    if (!isAdmin(req) && String(pet.user) !== String(req.params.userId)) {
      return res.status(403).send({ success: false, message: "Bạn không có quyền sửa thú cưng này." });
    }

    pet.name = req.body.name;
    pet.age = Number(req.body.age || 0);
    pet.petType = petType._id;
    if (req.body.imageUrl !== undefined) pet.imageUrl = req.body.imageUrl || "";

    if (isAdmin(req) && req.body.ownerId) pet.user = req.body.ownerId;
    await pet.save();

    await pet.populate("petType");
    await pet.populate("user", "username name email");

    res.send({ success: true, data: presentPet(pet) });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
});


router.delete("/user/:userId/:petId", CheckLogin, async function (req, res) {
  if (!ensureSameUserOrAdmin(req, res)) return;

  try {
    const pet = await petModel.findOne({ _id: req.params.petId, isDeleted: false });
    if (!pet) {
      return res.status(404).send({ success: false, message: "Không tìm thấy thú cưng." });
    }

    if (!isAdmin(req) && String(pet.user) !== String(req.params.userId)) {
      return res.status(403).send({ success: false, message: "Bạn không có quyền xóa thú cưng này." });
    }

    pet.isDeleted = true;
    await pet.save();

    res.send({ success: true, message: "Xóa thú cưng thành công." });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
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