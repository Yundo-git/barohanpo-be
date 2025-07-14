// models/booksModel.js
import pool from "../../config/database.js";

export const booksModel = {
  findSlotsByPharmacy: async (p_id, from, to) => {
    try {
      const [rows] = await pool.query(
        `
        SELECT
          DATE(slot_date) AS date,
          SUM(CASE WHEN is_available = TRUE THEN 1 ELSE 0 END) > 0 AS is_available
        FROM reservation_slot
        WHERE p_id = ? AND slot_date BETWEEN ? AND ?
        GROUP BY slot_date
        ORDER BY slot_date
        `,
        [p_id, from, to]
      );

      return rows;
    } catch (error) {
      console.error("Error in booksModel.findSlotsByPharmacy:", error);
      throw error;
    }
  },
};
