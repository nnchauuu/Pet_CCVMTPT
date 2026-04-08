const { Agenda } = require('agenda');
const { MongoBackend } = require('@agendajs/mongo-backend');
const QRCode = require('qrcode');
const { sendBookingEmail , sendWelcomeEmail } = require('./sendMail');
const bookingModel = require('../schemas/bookings');

const agenda = new Agenda({
    backend: new MongoBackend({ 
        address: 'mongodb://localhost:27017/NNPTUD-C3',
        collection: 'agendaJobs'
    })
});
agenda.define('sendBookingEmailJob', async (job) => {
    const { email, bookingCode, time } = job.attrs.data;
    try {
        const qrBase64 = await QRCode.toDataURL(bookingCode);
        await sendBookingEmail(email, bookingCode, qrBase64, time);
        console.log("Done", email);
    } catch (error) {
        console.log("Lỗi", error.message);
    }
});
agenda.define('sendWelcomeEmailJob', async (job) => {
    const { email, name } = job.attrs.data;

    try {
        await sendWelcomeEmail(email, name);
        console.log("Welcome email sent to", email);
    } catch (error) {
        console.log("Lỗi welcome mail:", error.message);
    }
});
agenda.define('triggerNoShowEndOfDay', async (job) => {
    try {
        const now = new Date();
        let result = await bookingModel.updateMany(
            { 
                bookingStatus: 'CONFIRMED', 
                scheduledAt: { $lt: now },
                isDeleted: false 
            },
            { 
                $set: { bookingStatus: 'NO_SHOW' } 
            }
        );
        if (result.modifiedCount > 0) {
            console.log(`[Hệ thống] Kết thúc ngày: Đã chuyển ${result.modifiedCount} lịch không đến thành NO_SHOW.`);
        }
    } catch (error) {
        console.log("Lỗi chốt NO_SHOW cuối ngày:", error.message);
    }
});
const startBackgroundJobs = async () => {
    await agenda.start();
    await agenda.every('59 23 * * *', 'triggerNoShowEndOfDay', null, { timezone: 'Asia/Ho_Chi_Minh' });
    console.log('Background Jobs (Agenda) started');
};

module.exports = { agenda, startBackgroundJobs };