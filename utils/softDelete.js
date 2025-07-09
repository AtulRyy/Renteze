// utils/softDelete.js
const RecycleBin = require("../models/RecycleBin");

const softDelete = async ({ itemType, data, deletedBy }) => {
  await RecycleBin.create({ itemType, data, deletedBy });
};
module.exports = softDelete;
// This function handles soft deletion by saving the deleted item to the recycle bin
// It takes the item type, the data of the item, and the user who deleted it