import { pha_userModel } from "./pha_user.Model.js";

const fetchAll = async () => {
  try {
    const rows = await pha_userModel.findAll();
    return rows;
  } catch (error) {
    console.error("Error in pha_userService.fetchAll:", error);
    throw error;
  }
};

const fetchById = async (p_id) => {
  try {
    const row = await pha_userModel.findById(p_id);
    return row;
  } catch (error) {
    console.error("Error in pha_userService.fetchById:", error);
    throw error;
  }
};

export {
  fetchAll,
  fetchById,
  pha_userModel
};
