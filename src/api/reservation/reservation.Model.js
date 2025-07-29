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

  findAvailableDates: async (p_id) => {
    try {
      // 1. 먼저 예약 가능한 날짜들을 가져옵니다.
      const [rows] = await pool.query(
        `
        SELECT
          DATE_FORMAT(slot_date, '%Y-%m-%d') AS date,
          DATE_FORMAT(slot_time, '%H:%i') AS time,
          is_available
        FROM reservation_slot
        WHERE p_id = ? AND is_available = TRUE
        ORDER BY slot_date, slot_time
        `,
        [p_id]
      );

      const grouped = {};

      for (const row of rows) {
        if (!grouped[row.date]) {
          grouped[row.date] = {
            date: row.date,
            is_available: true,
            times: [],
          };
        }
        grouped[row.date].times.push(row.time); // 'HH:mm' 문자열
      }

      return Object.values(grouped);
    } catch (error) {
      console.error("Error in booksModel.findAvailableDates:", error);
      throw error;
    }
  },

  //예약하기
  insertReservation: async (conn, user_id, p_id, date, time, memo) => {
    try {
      const [result] = await conn.query(
        `
      INSERT INTO books (user_id, p_id, book_date, book_time, memo)
      VALUES (?, ?, ?, ?, ?)
      `,
        [user_id, p_id, date, time, memo || null]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error in booksModel.insertReservation:", error);
      throw error;
    }
  },
};
