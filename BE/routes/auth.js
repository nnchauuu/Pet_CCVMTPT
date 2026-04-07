var express = require("express");
var router = express.Router();
let userController = require('../controllers/users')
let { RegisterValidator, validatedResult, ChangePasswordValidator } = require('../utils/validator')
let { CheckLogin } = require('../utils/authHandler')
let crypto = require('crypto')
let { sendMail } = require('../utils/sendMail')
let mongoose = require('mongoose')
const { agenda } = require('../utils/backgroundHandler');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
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
        await agenda.now('sendWelcomeEmailJob', {
            email: newUser.email,
            name: newUser.username
        });
        res.send(newUser)
    } catch (error) {
        await session.abortTransaction()
        await session.endSession()
        res.status(404).send(error.message)
    }
})
router.post('/login', async function (req, res, next) {
    let { username, password } = req.body;
    let result = await userController.QueryLogin(username, password);
    if (!result) {
        res.status(404).send("thong tin dang nhap khong dung")
    } else {
        res.cookie("TOKEN_NNPTUD_C3", result, {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: false
        })
        res.status(200).json({
            success: true,
            data: {
                token: result
            }
        });
    }
})
router.post('/google', async function (req, res) {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).send({ success: false, message: 'Thiếu Google token' });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const email = payload.email;
        const fullName = payload.name || '';
        const googleId = payload.sub;

        let user = await userController.GetUserByEmail(email);

        if (!user) {
            const randomPassword = crypto.randomBytes(16).toString('hex');

            user = await userController.CreateAnUser(
                email.split('@')[0],
                randomPassword,
                email,
                '69b6231b3de61addb401ea26',
            );

            user.fullName = fullName;
            user.googleId = googleId;
            await user.save();
        }

        const jwt = require('jsonwebtoken');
        const appToken = jwt.sign(
            {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role ? user.role.name : 'USER',
            },
            'secret',
            { expiresIn: '1d' }
        );

        res.cookie('TOKEN_NNPTUD_C3', appToken, {
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: false,
        });

        res.status(200).json({
            success: true,
            data: {
                token: appToken,
            },
        });
    } catch (error) {
        res.status(400).send({ success: false, message: error.message });
    }
});
module.exports = router;