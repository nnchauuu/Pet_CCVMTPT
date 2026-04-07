const express = require("express");
const router = express.Router();
const bookingModel = require("../schemas/bookings");
const petModel = require("../schemas/pets");
const serviceModel = require("../schemas/services");
const paymentTxModel = require("../schemas/paymentTransactions");
const paymentsController = require("../controllers/payments");
const { CheckLogin } = require("../utils/authHandler");

const STATUS_TO_CODE = {
  PENDING: 0,
  PENDING_PAYMENT: 1,
  CONFIRMED: 2,
  IN_PROGRESS: 3,
  COMPLETED: 4,
  CANCELLED: 5,
  NO_SHOW: 6,
};

function statusToCode(status) {
  return STATUS_TO_CODE[status] ?? 0;
}

function generateBookingCode() {
  return `BK${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 900 + 100)}`;
}

function presentVoucher(voucher) {
  return {
    id: voucher._id.toString(),
    code: voucher.code,
    amount: Number(voucher.amount || 0),
    remainingAmount: Number(voucher.remainingAmount || 0),
    status: voucher.status,
    expiredAt: voucher.expiredAt,
  };
}

function presentBooking(booking, paidBookingIds = new Set()) {
  const paid = paidBookingIds.has(booking._id.toString());
  const pet = booking.pet && typeof booking.pet === "object" ? booking.pet : null;
  const user = booking.user && typeof booking.user === "object" ? booking.user : null;

  return {
    id: booking._id.toString(),
    bookingCode: booking.bookingCode,
    scheduledAt: booking.scheduledAt,
    expectedEndTime: booking.expectedEndTime,
    totalPrice: Number(booking.totalPrice || 0),
    notes: booking.notes || "",
    bookingStatus: statusToCode(booking.bookingStatus),
    createdAt: booking.createdAt,
    createAt: booking.createdAt,
    userId: user ? user._id.toString() : booking.user?.toString() || null,
    userName: user ? user.fullName || user.username || user.email || "" : "",
    petId: pet ? pet._id.toString() : booking.pet?.toString() || null,
    petName: pet ? pet.name : "",
    petMongoId: pet ? pet._id.toString() : null,
    services: (booking.services || []).map((item) => {
      const service = item.service && typeof item.service === "object" ? item.service : null;
      return {
        id: service ? service._id.toString() : item.service?.toString() || null,
        name: service ? service.name : "Dịch vụ",
        price: Number(item.priceAtTime ?? service?.price ?? 0),
        durationInMinutes: Number(service?.durationInMinutes || 0),
      };
    }),
    isPaid: paid,
    paid,
  };
}

async function buildPaidBookingIds(bookings) {
  const bookingIds = bookings.map((item) => item._id);
  const paidTransactions = await paymentTxModel.find({
    booking: { $in: bookingIds },
    paymentStatus: "SUCCESS",
  });

  return new Set(paidTransactions.map((item) => item.booking.toString()));
}

async function getPopulatedBookings(filter) {
  return bookingModel
    .find(filter)
    .populate("user")
    .populate({ path: "pet", populate: { path: "petType" } })
    .populate("services.service")
    .sort({ createdAt: -1 });
}

async function findOwnedPet(userId, petId) {
  return petModel.findOne({
    _id: petId,
    user: userId,
    isDeleted: false,
  });
}

async function hasScheduleConflict(startAt, endAt) {
  const conflict = await bookingModel.findOne({
    isDeleted: false,
    bookingStatus: { $nin: ["CANCELLED", "NO_SHOW"] },
    scheduledAt: { $lt: endAt },
    expectedEndTime: { $gt: startAt },
  });

  return Boolean(conflict);
}

router.get("/available-slots", async function (req, res) {
  try {
    const durationInMinutes = Number(req.query.durationInMinutes || req.query.duration || 0);
    const selectedDay = req.query.selectedDay || req.query.date;

    if (!selectedDay || !durationInMinutes) {
      throw new Error("Thiếu ngày hẹn hoặc thời lượng dịch vụ.");
    }

    const dayStart = new Date(`${selectedDay}T08:00:00`);
    const dayEnd = new Date(`${selectedDay}T18:00:00`);
    const now = new Date();
    const slots = [];

    for (let cursor = new Date(dayStart); cursor < dayEnd; cursor = new Date(cursor.getTime() + 30 * 60 * 1000)) {
      const slotEnd = new Date(cursor.getTime() + durationInMinutes * 60 * 1000);
      if (slotEnd > dayEnd || cursor <= now) {
        continue;
      }

      const conflict = await hasScheduleConflict(cursor, slotEnd);
      if (!conflict) {
        slots.push({
          startAt: cursor.toISOString(),
          endAt: slotEnd.toISOString(),
        });
      }
    }

    res.send({
      success: true,
      data: slots,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

router.post("/user/:userId", CheckLogin, async function (req, res) {
  try {
    if (String(req.user.id) !== String(req.params.userId)) {
      return res.status(403).send({
        success: false,
        message: "Bạn không có quyền tạo lịch hẹn cho người dùng khác.",
      });
    }

    const pet = await findOwnedPet(req.user.id, req.body.petId);
    if (!pet) {
      throw new Error("Không tìm thấy thú cưng của người dùng hiện tại.");
    }

    const services = await serviceModel.find({
      _id: { $in: req.body.services || [] },
      isDeleted: false,
      isActive: true,
    });

    if (!services.length) {
      throw new Error("Không tìm thấy dịch vụ hợp lệ để đặt lịch.");
    }

    const scheduledAt = new Date(req.body.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new Error("Thời gian đặt lịch không hợp lệ.");
    }

    const totalDuration = services.reduce(
      (sum, service) => sum + Number(service.durationInMinutes || 0),
      0,
    );
    const expectedEndTime = new Date(scheduledAt.getTime() + totalDuration * 60 * 1000);

    if (await hasScheduleConflict(scheduledAt, expectedEndTime)) {
      throw new Error("Khung giờ này đã có lịch hẹn khác. Vui lòng chọn giờ khác.");
    }

    const booking = await bookingModel.create({
      bookingCode: generateBookingCode(),
      scheduledAt,
      expectedEndTime,
      totalPrice: services.reduce((sum, service) => sum + Number(service.price || 0), 0),
      notes: req.body.notes || "",
      bookingStatus: "PENDING",
      holdExpiredAt: new Date(Date.now() + 5 * 60 * 1000),
      user: req.user.id,
      pet: pet._id,
      services: services.map((service) => ({
        service: service._id,
        priceAtTime: Number(service.price || 0),
      })),
    });

    const [populatedBooking] = await getPopulatedBookings({ _id: booking._id, isDeleted: false });

    res.send({
      success: true,
      data: presentBooking(populatedBooking),
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

router.get("/me/vouchers", CheckLogin, async function (req, res) {
  try {
    const vouchers = await paymentsController.getUserVouchers(req.user.id);

    res.send({
      success: true,
      data: vouchers.map(presentVoucher),
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

router.get("/me", CheckLogin, async function (req, res) {
  try {
    const filter = {
      user: req.user.id,
      isDeleted: false,
    };

    if (req.query.petId) {
      filter.pet = req.query.petId;
    }

    const bookings = await getPopulatedBookings(filter);
    const paidBookingIds = await buildPaidBookingIds(bookings);

    res.send({
      success: true,
      data: bookings.map((booking) => presentBooking(booking, paidBookingIds)),
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

router.get("/me/:id", CheckLogin, async function (req, res) {
  try {
    const [booking] = await getPopulatedBookings({
      _id: req.params.id,
      user: req.user.id,
      isDeleted: false,
    });

    if (!booking) {
      return res.status(404).send({
        success: false,
        message: "Không tìm thấy lịch hẹn.",
      });
    }

    const paidBookingIds = await buildPaidBookingIds([booking]);
    res.send({
      success: true,
      data: presentBooking(booking, paidBookingIds),
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

router.post("/me/:id/cancel", CheckLogin, async function (req, res) {
  try {
    const result = await paymentsController.cancelBookingAndIssueVoucher(req.user.id, req.params.id);

    res.send({
      success: true,
      data: {
        booking: presentBooking(result.booking),
        voucherCreated: result.voucherCreated,
        voucherCode: result.voucherCode || null,
        voucherAmount: Number(result.voucherAmount || 0),
        message: result.message,
      },
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;