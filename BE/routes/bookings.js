let express = require("express");
let router = express.Router();
let bookingController = require("../controllers/booking");
let paymentsController = require("../controllers/payments");
let { CheckLogin, checkRole } = require("../utils/authHandler");
let { validatedResult, CreateBookingValidator } = require("../utils/validator");

function canAccessUserBookings(req, targetUserId) {
  return req.user?.id === targetUserId || req.user?.role?.name === "ADMIN";
}

const STATUS_STRING_TO_NUMBER = {
  PENDING: 0,
  PENDING_PAYMENT: 1,
  CONFIRMED: 2,
  IN_PROGRESS: 3,
  COMPLETED: 4,
  CANCELLED: 5,
  NO_SHOW: 6,
};

function presentBooking(b) {
  if (!b) return null;
  const raw = typeof b.toObject === "function" ? b.toObject({ virtuals: true }) : b;

  const userObj = raw.user && typeof raw.user === "object" ? raw.user : null;
  const petObj = raw.pet && typeof raw.pet === "object" ? raw.pet : null;

  const statusNum = typeof raw.bookingStatus === "number"
    ? raw.bookingStatus
    : STATUS_STRING_TO_NUMBER[raw.bookingStatus] ?? -1;

  const services = Array.isArray(raw.services)
    ? raw.services.map((item) => {
        const svc = item.service && typeof item.service === "object" ? item.service : null;
        return {
          id: String(svc?._id || svc?.id || item.service || ""),
          name: svc?.name || "Dịch vụ",
          price: Number(item.priceAtTime ?? svc?.price ?? 0),
        };
      })
    : [];

  return {
    id: String(raw._id || raw.id || ""),
    bookingCode: raw.bookingCode || "",
    scheduledAt: raw.scheduledAt,
    expectedEndTime: raw.expectedEndTime,
    totalPrice: Number(raw.totalPrice || 0),
    notes: raw.notes || "",
    bookingStatus: statusNum,
    userName: userObj?.username || userObj?.name || "",
    petName: petObj?.name || "",
    petId: String(petObj?._id || petObj?.id || raw.pet || ""),
    services,
    isPaid: false,
    createdAt: raw.createdAt,
  };
}

router.get("/", CheckLogin, checkRole("ADMIN"), async function (req, res) {
  let bookings = await bookingController.GetAllBookings();
  res.send(bookings);
});

router.get("/week", CheckLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    let bookings = await bookingController.GetAllBookingsInWeek(
      req.query.startDate,
    );
    res.send(bookings);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.get("/me", CheckLogin, async function (req, res) {
  try {
    let bookings = await bookingController.GetUserBookings(req.user.id);
    let result = bookings.map(presentBooking);
    if (req.query.petId) {
      result = result.filter((b) => b.petId === req.query.petId);
    }
    res.send({ success: true, data: result });
  } catch (err) {
    res.status(400).send({ success: false, message: err.message });
  }
});

router.get("/me/vouchers", CheckLogin, async function (req, res) {
  try {
    const vouchers = await paymentsController.getUserVouchers(req.user.id);
    res.send({ success: true, data: vouchers });
  } catch (err) {
    res.status(400).send({ success: false, message: err.message });
  }
});

router.get("/me/:bookingId", CheckLogin, async function (req, res) {
  try {
    let booking = await bookingController.GetBookingDetail(req.params.bookingId);
    if (!booking) {
      return res.status(404).send({ success: false, message: "Không tìm thấy lịch hẹn" });
    }
    if (String(booking.user?._id || booking.user) !== String(req.user.id)) {
      return res.status(403).send({ success: false, message: "Bạn không có quyền xem lịch hẹn này." });
    }
    res.send({ success: true, data: presentBooking(booking) });
  } catch (err) {
    res.status(400).send({ success: false, message: err.message });
  }
});

router.post("/me/:bookingId/cancel", CheckLogin, async function (req, res) {
  try {
    let result = await paymentsController.cancelBookingAndIssueVoucher(
      req.user.id,
      req.params.bookingId,
    );
    res.send({
      success: true,
      data: {
        booking: result.booking ? presentBooking(result.booking) : null,
        voucherCreated: result.voucherCreated || false,
        voucherCode: result.voucherCode || null,
        voucherAmount: result.voucherAmount || 0,
        message: result.message || "Đã hủy lịch hẹn.",
      },
    });
  } catch (err) {
    res.status(400).send({ success: false, message: err.message });
  }
});

router.get("/available-slots", async function (req, res) {
  try {
    const duration = Number(
      req.query.durationInMinutes ?? req.query.duration,
    );
    const selectedDay = req.query.selectedDay ?? req.query.date;

    if (!selectedDay) {
      return res
        .status(400)
        .send({ success: false, message: "Thiếu ngày đặt lịch." });
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      return res
        .status(400)
        .send({ success: false, message: "Thời lượng dịch vụ không hợp lệ." });
    }

    let slots = await bookingController.GetAvailableBookingSlots(
      duration,
      selectedDay,
    );

    res.send({ success: true, data: slots });
  } catch (err) {
    res.status(400).send({ success: false, message: err.message });
  }
});

router.get("/code/:code", async function (req, res) {
  try {
    let booking = await bookingController.GetBookingDetailByCode(
      req.params.code,
    );
    if (!booking)
      return res
        .status(404)
        .send({ success: false, message: "Không tìm thấy hóa đơn" });
    res.send({ success: true, data: booking });
  } catch (err) {
    res.status(400).send({ success: false, message: err.message });
  }
});

router.get("/:id", async function (req, res) {
  let booking = await bookingController.GetBookingDetail(req.params.id);
  if (!booking)
    return res.status(404).send({ message: "Không tìm thấy lịch hẹn" });
  res.send(booking);
});

router.post(
  "/",
  CheckLogin,
  CreateBookingValidator,
  validatedResult,
  async function (req, res) {
    let targetUserId = req.body.userId ? req.body.userId : req.user.id;
    let booking = await bookingController.CreateBooking(
      targetUserId,
      req.body.petId,
      req.body.services,
      req.body.scheduledAt,
      req.body.notes,
    );
    if (!booking) return res.status(400).send({ message: "Lỗi tạo lịch hẹn" });
    res.send(booking);
  },
);

router.post(
  "/user/:userId",
  CheckLogin,
  CreateBookingValidator,
  validatedResult,
  async function (req, res) {
    try {
      if (!canAccessUserBookings(req, req.params.userId)) {
        return res
          .status(403)
          .send({ success: false, message: "Bạn không có quyền tạo lịch cho người dùng này." });
      }

      let booking = await bookingController.CreateBooking(
        req.params.userId,
        req.body.petId,
        req.body.services,
        req.body.scheduledAt,
        req.body.notes,
      );

      if (!booking) {
        return res
          .status(400)
          .send({ success: false, message: "Lỗi tạo lịch hẹn" });
      }

      res.send({ success: true, data: booking });
    } catch (err) {
      res.status(400).send({ success: false, message: err.message });
    }
  },
);

router.put("/:id/confirm", CheckLogin, async function (req, res) {
  let booking = await bookingController.ConfirmBooking(req.params.id);
  if (!booking) return res.status(400).send({ message: "Không thể xác nhận" });
  res.send(booking);
});

router.put(
  "/:id/start",
  CheckLogin,
  checkRole("ADMIN"),
  async function (req, res) {
    let booking = await bookingController.StartBooking(req.params.id);
    if (!booking) return res.status(400).send({ message: "Không thể bắt đầu" });
    res.send(booking);
  },
);

router.put(
  "/:id/complete",
  CheckLogin,
  checkRole("ADMIN"),
  async function (req, res) {
    let booking = await bookingController.CompleteBooking(
      req.params.id,
      req.body.paymentMethod,
    );
    if (!booking)
      return res.status(400).send({ message: "Không thể hoàn thành" });
    res.send(booking);
  },
);

router.delete("/:id", CheckLogin, async function (req, res) {
  let success = await bookingController.DeleteBooking(req.params.id);
  if (!success) return res.status(400).send({ message: "Không thể xóa" });
  res.send({ message: "Xóa thành công" });
});

router.put("/:id", CheckLogin, async function (req, res) {
  try {
    let targetUserId = req.body.userId ? req.body.userId : req.user.id;
    let updatedBooking = await bookingController.UpdateBooking(
      req.params.id,
      targetUserId,
      req.body.petId,
      req.body.services,
      req.body.scheduledAt,
      req.body.notes,
    );

    if (!updatedBooking) {
      return res
        .status(400)
        .send({
          message:
            "Lỗi cập nhật lịch hẹn (Có thể do trùng giờ hoặc dữ liệu sai)",
        });
    }
    res.send({ success: true, data: updatedBooking });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
