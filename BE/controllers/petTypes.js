let petTypeModel = require('../schemas/petTypes');

module.exports = {
    getActivePetTypes: async function () {
        return await petTypeModel.find({ isDeleted: false, isActive: true });
    },

};