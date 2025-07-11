import pool from "../../config/database.js";

export const pha_userModel = {
  findAll: async () => {
    try {
      const [rows] = await pool.query("SELECT * FROM pha_user");
      return rows;
    } catch (error) {
      console.error("Error in pha_userModel.findAll:", error);
      throw error;
    }
  },
  findById: async (p_id) => {
    try {
      const [rows] = await pool.query("SELECT * FROM pha_user WHERE p_id = ?", [
        p_id,
      ]);
      return rows[0];
    } catch (error) {
      console.error("Error in pha_userModel.findById:", error);
      throw error;
    }
  },
};

export default pha_userModel;
