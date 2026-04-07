var express = require("express");
var router = express.Router();
let bcrypt = require('bcrypt')
let userModel = require("../schemas/users");
let { validatedResult, CreateAnUserValidator, ModifyAnUserValidator } = require('../utils/validator')
let userController = require('../controllers/users')
let { CheckLogin, checkRole } = require('../utils/authHandler')

router.get("/search", async function (req, res) {
    try {
        const keyword = req.query.email || req.query.q || "";
        let user = await userController.GetUserByEmail(keyword);
        if (!user) {
            const userModel = require("../schemas/users");
            const users = await userModel.find({
                isDeleted: false,
                $or: [
                    { email: { $regex: keyword, $options: "i" } },
                    { username: { $regex: keyword, $options: "i" } }
                ]
            }).limit(5);
            if (users.length === 0) return res.status(404).send({ success: false, message: "Không tìm thấy khách hàng" });
            return res.send({ success: true, data: users.map(u => ({ id: u._id.toString(), username: u.username, email: u.email })) });
        }
        res.send({ success: true, data: { id: user._id.toString(), username: user.username, email: user.email } });
    } catch (err) {
        res.status(400).send({ success: false, message: err.message });
    }
});
router.get("/", CheckLogin, checkRole("ADMIN"), async function (req, res, next) {//ADMIN
  let users = await userController.GetAllUser()
  res.send(users);
});
router.get("/:id", async function (req, res, next) {
  let result = await userController.GetUserById(
    req.params.id
  )
  if (result) {
    res.send(result);
  } else {
    res.status(404).send({ message: "id not found" })
  }
});

router.post("/", CreateAnUserValidator, validatedResult, async function (req, res, next) {
  
  try {
    let user = await userController.CreateAnUser(
      req.body.username, req.body.password,
      req.body.email, req.body.role
    )
    res.send(user);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});
router.put("/:id/role", CheckLogin, checkRole("ADMIN"), async function (req, res) {
    try {
        let userId = req.params.id;
        let newRoleId = req.body.roleId;
        if (!newRoleId) {
            return res.status(400).send({ success: false, message: "Thiếu role mới" });
        }
        let updatedUser = await userController.ChangeRole(userId, newRoleId);
        if (!updatedUser) {
            return res.status(404).send({ success: false, message: "Lỗi cập nhật" });
        }
        res.send({ 
            success: true,
            message: "Cập nhật quyền thành công", 
            data: updatedUser 
        });
    } catch (err) {
        res.status(400).send({ success: false, message: err.message });
    }
});
module.exports = router;