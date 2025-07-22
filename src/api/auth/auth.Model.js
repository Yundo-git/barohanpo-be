import pool from "../../config/database.js";

export const authModel = {
  signup: async (email, password, name, phone) => {
    try {
      const [rows] = await pool.query(
        "INSERT INTO users (email, password, name, phone) VALUES (?, ?, ?, ?)",
        [email, password, name, phone]
      );
      return rows;
    } catch (error) {
      console.error("Error in authModel.signup:", error);
      throw error;
    }
  },
};
