// models/booksModel.js
const db = require("../../config/database");

const booksModel = {
  findSlotsByPharmacy: async (p_id, from, to) => {
    try {
      const [rows] = await db.query(
        `SELECT
          DATE(slot_date) AS date,
          SUM(CASE WHEN is_available = TRUE THEN 1 ELSE 0 END) > 0 AS is_available
        FROM reservation_slot
        WHERE p_id = ? AND slot_date BETWEEN ? AND ?
        GROUP BY slot_date
        ORDER BY slot_date`,
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
      const [rows] = await db.query(
        `SELECT DISTINCT DATE(slot_date) as date 
         FROM reservation_slot 
         WHERE p_id = ? AND is_available = TRUE 
         AND slot_date >= CURDATE() 
         ORDER BY date`,
        [p_id]
      );

      // 2. 각 날짜별로 예약 가능한 시간대를 가져옵니다.
      const availableDates = [];
      for (const row of rows) {
        const date = row.date;
        const [timeSlots] = await db.query(
          `SELECT 
             p_id,
             slot_date,
             slot_time
           FROM reservation_slot 
           WHERE p_id = ? 
             AND DATE(slot_date) = ? 
             AND is_available = TRUE
           ORDER BY slot_date`,
          [p_id, date]
        );

        // 각 시간대별로 객체를 생성하여 배열에 추가
        timeSlots.forEach((slot) => {
          const slotDate = new Date(slot.slot_date);

          availableDates.push({
            p_id: slot.p_id,
            date: date,
            is_available: true,
            time: slot.slot_time,
          });
        });
      }
      console.log("availableDates", availableDates);
      return availableDates;
    } catch (error) {
      console.error("Error in findAvailableDates:", error);
      throw error;
    }
  },

  // 예약하기
  insertReservation: async (user_id, p_id, date, time, memo) => {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Check if the slot is still available
      const [slots] = await conn.query(
        `SELECT id FROM reservation_slot 
         WHERE p_id = ? AND DATE(slot_date) = ? AND slot_time = ? AND is_available = TRUE
         FOR UPDATE`,
        [p_id, date, time]
      );

      if (slots.length === 0) {
        throw new Error("The selected time slot is no longer available");
      }

      // Insert the reservation
      const [result] = await conn.query(
        `INSERT INTO reservation (user_id, p_id, date, time, memo) 
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, p_id, date, time, memo || null]
      );

      // Mark the slot as not available
      await conn.query(
        `UPDATE reservation_slot 
         SET is_available = FALSE 
         WHERE p_id = ? AND DATE(slot_date) = ? AND slot_time = ?`,
        [p_id, date, time]
      );

      await conn.commit();
      return result;
    } catch (error) {
      console.error("Error in insertReservation:", error);
      if (conn) await conn.rollback();
      throw error;
    } finally {
      if (conn) conn.release();
    }
  },
};

module.exports = { booksModel };
