import { db } from "../../config/database.js";
const { pool } = db;

const booksModel = {
  findSlotsByPharmacy: async (p_id, from, to) => {
    try {
      const [rows] = await pool.query(
        `SELECT
          DATE(slot_date) AS date,
          SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END) > 0 AS is_available
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
      const [rows] = await pool.query(
        `SELECT DISTINCT DATE(slot_date) as date 
         FROM reservation_slot 
         WHERE p_id = ? 
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
             slot_time,
             is_available
           FROM reservation_slot 
           WHERE p_id = ? 
             AND slot_date = ? 
           ORDER BY slot_date`,
          [p_id, date]
        );

        // 각 시간대별로 객체를 생성하여 배열에 추가
        timeSlots.forEach((slot) => {
          const slotDate = new Date(slot.slot_date);

          availableDates.push({
            p_id: slot.p_id,
            date: date,
            is_available: slot.is_available || 0, // 실제 is_available 값 사용
            time: slot.slot_time,
          });
        });
      }
      // console.log("availableDates", availableDates);
      return availableDates;
    } catch (error) {
      console.error("Error in findAvailableDates:", error);
      throw error;
    }
  },

  // 예약하기: 슬롯 UPDATE 없이, books에 INSERT만 시도
  insertReservation: async (user_id, p_id, date, time, memo) => {
    const conn = await db.getConnection();
    try {
      await conn.query(
        "SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED"
      );
      await conn.beginTransaction();

      // ① 슬롯 존재 확인 (읽기만 — 락 없음)
      const [slotRows] = await conn.execute(
        `
      SELECT 1
      FROM reservation_slot
      WHERE p_id = ? AND slot_date = ? AND slot_time = ?
      LIMIT 1
      `,
        [p_id, date, time]
      );
      if (slotRows.length === 0) {
        await conn.rollback();
        throw new Error("해당 시간대 슬롯이 없습니다.");
      }

      // 예약 시도: UNIQUE로 중복 차단 (동시에 두 번 들어오면 한쪽은 ER_DUP_ENTRY)
      try {
        const [result] = await conn.execute(
          `
        INSERT INTO books (user_id, p_id, book_date, book_time, memo)
        VALUES (?, ?, ?, ?, ?)
        `,
          [user_id, p_id, date, time, memo ?? null]
        );
        await conn.commit();
        return result;
      } catch (e) {
        if (e && e.code === "ER_DUP_ENTRY") {
          await conn.rollback();
          throw new Error("이미 예약된 시간대입니다.");
        }
        await conn.rollback();
        throw e;
      }
    } finally {
      conn.release();
    }
  },

  findBooks: async (user_id) => {
    console.log("in model user_id", user_id);
    try {
      const [rows] = await pool.query(
        `SELECT * FROM books WHERE user_id = ? AND status= 'pending'`,
        [user_id]
      );
      return rows;
    } catch (error) {
      console.error("Error in findBooks:", error);
      throw error;
    }
  },
  postCancelBooks: async (user_id, book_id) => {
    console.log("in model user_id", user_id);
    console.log("in model book_id", book_id);
    try {
      const [result] = await db.query(
        `UPDATE books SET status = 'canceled' 
         WHERE user_id = ? AND book_id = ? AND status = 'pending'`,
        [user_id, book_id]
      );

      // Return success status and affected rows info
      return {
        success: true,
        affectedRows: result.affectedRows || 0,
      };
    } catch (error) {
      console.error("Error in postCancelBooks:", error);
      // Return error information instead of throwing
      return {
        success: false,
        error: error.message,
        affectedRows: 0,
      };
    }
  },

  findcancelBooks: async (user_id) => {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM books WHERE user_id = ? AND status = 'canceled'`,
        [user_id]
      );
      return rows;
    } catch (error) {
      console.error("Error in findcancelBooks:", error);
      // Return empty array instead of throwing error
      return [];
    }
  },
};

// const sendEmail = async (user_id, p_id, date, time, memo) => {
//   try {
//     const rows = await booksModel.sendEmail(user_id, p_id, date, time, memo);
//     return rows;
//   } catch (error) {
//     console.error("Error in sendEmail:", error);
//     throw error;
//   }
// };

export default booksModel;
