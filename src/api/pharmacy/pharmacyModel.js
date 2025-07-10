import pool from "../../config/database.js";

/**
 * Pharmacy model
 */
export const pharmacyModel = {
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
      return rows;
    } catch (error) {
      console.error("Error in pharmacyModel.findNearby:", error);
      throw error;
    }
  },
};

export default pharmacyModel;
