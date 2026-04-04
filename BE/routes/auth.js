var express = require("express");
var router = express.Router();
let userController = require('../controllers/users')
let { RegisterValidator, validatedResult, ChangePasswordValidator } = require('../utils/validator')
let { CheckLogin } = require('../utils/authHandler')
let crypto = require('crypto')
let mongoose = require('mongoose')
router.post('/register', RegisterValidator, validatedResult, async function (req, res, next) {
    let session = await mongoose.startSession();
    let transaction = session.startTransaction()
    try {
        let { username, password, email } = req.body;
        let newUser = await userController.CreateAnUser(
            username, password, email, '69b6231b3de61addb401ea26', session
        )
        await session.commitTransaction()
        await session.endSession()
        res.send(newUser)
    } catch (error) {
        await session.abortTransaction()
        await session.endSession()
        res.status(404).send(error.message)
    }
})
module.exports = router;