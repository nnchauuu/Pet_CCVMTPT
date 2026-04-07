let { body, validationResult } = require('express-validator')
module.exports = {
    validatedResult: function (req, res, next) {
        let result = validationResult(req);
        if (result.errors.length > 0) {
            res.status(400).send({
                success: false,
                message: result.errors[0].msg
            });
            return;
        }
        next();
    },
    CreateAnUserValidator: [
        body('email').notEmpty().withMessage("email khong duoc de trong").bail().isEmail().withMessage("email sai dinh dang").normalizeEmail(),
        body('username').notEmpty().withMessage("username khong duoc de trong").bail().isAlphanumeric().withMessage("username khong duoc chua ki tu dac biet"),
        body('password').notEmpty().withMessage("password khong duoc de trong").bail().isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minNumbers: 1,
            minSymbols: 1,
            minUppercase: 1
        }).withMessage("password phai co it nhat 8 ki tu trong do co it nhat 1 ki tu chu hoa, 1 ki tu chu thuong,1 ki tu so va 1 ki tu dac biet"),
        body('role').notEmpty().withMessage("role khong duoc de trong").bail().isMongoId().withMessage("role phai la ID"),
        body('avatarUrl').optional().isArray().withMessage("avatarURl pahi la 1 mang"),
        body('avatarUrl.*').isURL().withMessage("URL khong hop le"),
    ],
    RegisterValidator: [
        body('email').notEmpty().withMessage("email khong duoc de trong").bail().isEmail().withMessage("email sai dinh dang").normalizeEmail(),
        body('username').notEmpty().withMessage("username khong duoc de trong").bail().isAlphanumeric().withMessage("username khong duoc chua ki tu dac biet"),
        body('password').notEmpty().withMessage("password khong duoc de trong").bail().isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minNumbers: 1,
            minSymbols: 1,
            minUppercase: 1
        }).withMessage("password phai co it nhat 8 ki tu trong do co it nhat 1 ki tu chu hoa, 1 ki tu chu thuong,1 ki tu so va 1 ki tu dac biet"),
    ],
    CreateBookingValidator: [
        body('petId')
            .notEmpty().withMessage("Thú cưng không được để trống")
            .bail()
            .isMongoId().withMessage("Mã thú cưng không hợp lệ"),
        
        body('services')
            .isArray({ min: 1 }).withMessage("Phải chọn ít nhất 1 dịch vụ"),

        body('scheduledAt')
            .notEmpty().withMessage("Thời gian đặt lịch không được để trống")
    ]
}