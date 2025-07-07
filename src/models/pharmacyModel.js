import pool from "../config/database.js";

/**
 * Pharmacy model
 */
export const pharmacyModel = {
  /**
   * Fetch all pharmacies
   */
  findAll: async () => {
    try {
      const [rows] = await pool.query("SELECT name FROM pharmacy");
      return rows;
    } catch (error) {
      console.error("Error in pharmacyModel.findAll:", error);
      throw error;
    }
  },

  /**
   * Fetch pharmacy by id
   * @param {string|number} id
   */
  findById: async (id) => {
    try {
      const rows = await pool.query("SELECT * FROM pharmacy WHERE id = ?", [
        id,
      ]);
      return rows[0][0] || null;
    } catch (error) {
      console.error("Error in pharmacyModel.findById:", error);
      throw error;
    }
  },
};

export default pharmacyModel;
