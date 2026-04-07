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
const startBackgroundJobs = async () => {
    await agenda.start();
    console.log('Background Jobs (Agenda) started');
};

module.exports = { agenda, startBackgroundJobs };