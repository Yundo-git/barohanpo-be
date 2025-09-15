import { db } from "../../config/database.js";
const { pool } = db;

/**
 * Pharmacy model
 */
const pharmacyModel = {
  /**
   * Fetch all pharmacies
   */
  findAll: async () => {
    try {
      const [rows] = await pool.query("SELECT * FROM pharmacy");
      return rows;
    } catch (error) {
      console.error("Error in pharmacyModel.findAll:", error);
      throw error;
    }
  },

  findNearby: async (latitude, longitude, radiusKm = 4) => {
    try {
      // Haversine formula in MySQL to calculate distance (km)
      const query = `
        SELECT p_id, name, address,latitude, longitude,
          (6371 * acos(
            cos(radians(?)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(latitude))
          )) AS distance
        FROM pharmacy
        HAVING distance <= ?
        ORDER BY distance`;

      const params = [latitude, longitude, latitude, radiusKm];
      const [rows] = await pool.query(query, params);
      console.log("data", rows);
      return rows;
    } catch (error) {
      console.error("Error in pharmacyModel.findNearby:", error);
      throw error;
    }
  },

  findById: async (p_id) => {
    console.log("p_id in model", p_id);
    try {
      const [rows] = await pool.query("SELECT * FROM pharmacy WHERE p_id = ?", [
        p_id,
      ]);
      return rows[0];
    } catch (error) {
      console.error("Error in pharmacyModel.findById:", error);
      throw error;
    }
  },
};

// Export the pharmacyModel object directly
export default pharmacyModel;
