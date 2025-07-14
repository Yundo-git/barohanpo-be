// services/reservation.service.js
import { booksModel } from "./reservation.Model.js";
import pool from "../../config/database.js";

export const fetchSlotsInRange = async (p_id, from, to) => {
  try {
    const rows = await booksModel.findSlotsByPharmacy(p_id, from, to);
    return rows;
  } catch (error) {
    console.error("Error in fetchSlotsInRange:", error);
    throw error;
  }
};

export const fetchAvailableDates = async (p_id) => {
  try {
    const rows = await booksModel.findAvailableDates(p_id);
    return rows;
  } catch (error) {
    console.error("Error in fetchAvailableDates:", error);
    throw error;
  }
};

const reservationService = {
  createReservation: async ({ user_id, pharmacy_id, date, time, memo }) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. 슬롯 예약 불가능 처리
      const [updateResult] = await connection.query(
        `
        UPDATE reservation_slot
        SET is_available = 0
        WHERE p_id = ? AND slot_date = ? AND slot_time = ? AND is_available = 1
        `,
        [pharmacy_id, date, time]
      );

      if (updateResult.affectedRows === 0) {
        throw new Error("해당 시간대는 이미 예약되었거나 존재하지 않습니다.");
      }

      // 2. books 테이블에 예약 정보 저장
      const book_id = await booksModel.insertReservation(
        connection,
        user_id,
        pharmacy_id,
        date,
        time,
        memo
      );

      await connection.commit();

      return {
        success: true,
        message: "예약이 완료되었습니다.",
        book_id,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};

export { reservationService };
  