let serviceModel = require("../schemas/services");
let bookingModel = require("../schemas/bookings");

module.exports = {
  GetAllActiveServices: async function () {
    try {
      const services = await serviceModel
        .find({
          isActive: true,
          isDeleted: false,
        })
        .sort({ name: 1 })
        .lean();

      return services.map((s) => {
        const { _id, ...rest } = s;
        return { ...rest, id: _id.toString() };
      });
    } catch (error) {
      throw new Error("Lỗi khi tải danh sách dịch vụ: " + error.message);
    }
  },

  GetServicesByPetType: async function (petTypeId) {
    try {
      const services = await serviceModel
        .find({
          petTypes: petTypeId,
          isActive: true,
          isDeleted: false,
        })
        .lean();

      return services.map((s) => {
        const { _id, ...rest } = s;
        return { ...rest, id: _id.toString() };
      });
    } catch (error) {
      return [];
    }
  },

  GetServiceById: async function (id) {
    try {
      const service = await serviceModel
        .findOne({
          _id: id,
          isDeleted: false,
        })
        .lean();

      if (!service) {
        throw new Error("Không tìm thấy dịch vụ");
      }

      const { _id, ...rest } = service;
      return { ...rest, id: _id.toString() };
    } catch (error) {
      throw error;
    }
  },
};
