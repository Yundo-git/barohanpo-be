// services/reservation.service.js
const { booksModel } = require("./reservation.Model");
const { pool } = require("../../config/database");
const { log } = require("winston");

const fetchSlotsInRange = async (p_id, from, to) => {
  try {
    const rows = await booksModel.findSlotsByPharmacy(p_id, from, to);
    return rows;
  } catch (error) {
    console.error("Error in fetchSlotsInRange:", error);
    throw error;
  }
};

const fetchAvailableDates = async (p_id) => {
  try {
    const rows = await booksModel.findAvailableDates(p_id);
    return rows;
  } catch (error) {
    console.error("Error in fetchAvailableDates:", error);
    throw error;
  }
};

const reservationService = {
  createReservation: async (user_id, p_id, date, time, memo) => {
    const connection = await pool.getConnection();
    console.log("in service user_id", user_id);
    console.log("in service p_id", p_id);
    console.log("in service date", date);
    console.log("in service time", time);
    console.log("in service memo", memo);
    try {
      if (!user_id || !p_id || !date || !time) {
        throw new Error("필수 파라미터가 누락되었습니다.");
      }

      await connection.beginTransaction();

      // 1. Make slot unavailable
      const [updateResult] = await connection.query(
        `
        UPDATE reservation_slot
        SET is_available = 0
        WHERE p_id = ? AND DATE(slot_date) = ? AND slot_time = ? AND is_available = 1
        `,
        [p_id, date, time]
      );

      if (updateResult.affectedRows === 0) {
        throw new Error("해당 시간대는 이미 예약되었거나 존재하지 않습니다.");
      }

      // 2. Save reservation to books table
      const book_id = await booksModel.insertReservation(
        user_id,
        p_id,
        date,
        time,
        memo || ""
      );

      await connection.commit();

      return {
        success: true,
        message: "예약이 완료되었습니다.",
        book_id,
      };
    } catch (error) {
      console.error("Error in createReservation:", error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};

//예약내역 조회
const fetchBooks = async (user_id) => {
  try {
    const rows = await booksModel.findBooks(user_id);
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.error("Error in fetchBooks:", error);
    return [];
  }
};
//예약취소
const fetchCancelBooks = async (user_id, book_id) => {
  console.log("in service user_id", user_id);
  console.log("in service book_id", book_id);
  try {
    const rows = await booksModel.postCancelBooks(user_id, book_id);
    console.log("in service user_id", user_id);
    console.log("in service book_id", book_id);
    return rows;
  } catch (error) {
    console.error("Error in fetchCancelBooks:", error);
    throw error;
  }
};

const fetchcancelList = async (user_id) => {
  try {
    const rows = await booksModel.findcancelBooks(user_id);
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.error("Error in fetchcancelList:", error);
    return [];
  }
};

module.exports = {
  fetchSlotsInRange,
  fetchAvailableDates,
  reservationService,
  fetchBooks,
  fetchCancelBooks, // Fixed typo in function name
  fetchcancelList,
};
