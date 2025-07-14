// src/utils/initSlotGenerator.ts
import dayjs from "dayjs";
import pool from "../config/database.js";

const TIMES = ["09:00:00", "10:00:00", "11:00:00", "14:00:00", "15:00:00"];

export async function initSlotGenerator() {
  const conn = await pool.getConnection();

  try {
    const today = dayjs();
    const slotDates = Array.from({ length: 7 }, (_, i) =>
      today.add(i, "day").format("YYYY-MM-DD")
    );

    const [pharmacies] = await conn.query("SELECT p_id FROM pharmacy");

    for (const { p_id } of pharmacies) {
      // 1. 이미 생성된 날짜 목록 조회
      const [existingDatesRows] = await conn.query(
        `SELECT DISTINCT slot_date FROM reservation_slot 
         WHERE p_id = ? AND slot_date BETWEEN ? AND ?`,
        [p_id, slotDates[0], slotDates[6]]
      );

      const existingDates = new Set(
        existingDatesRows.map((row) =>
          dayjs(row.slot_date).format("YYYY-MM-DD")
        )
      );

      // 2. 생성되지 않은 날짜만 슬롯 생성
      const datesToInsert = slotDates.filter(
        (date) => !existingDates.has(date)
      );

      for (const date of datesToInsert) {
        for (const time of TIMES) {
          await conn.query(
            `INSERT IGNORE INTO reservation_slot (p_id, slot_date, slot_time, is_available)
             VALUES (?, ?, ?, TRUE)`,
            [p_id, date, time]
          );
        }
      }

      console.log(
        `🗓️ p_id=${p_id} → 새 슬롯 생성: ${datesToInsert.length}일치`
      );
    }

    console.log("✅ 예약 슬롯 생성 완료");
  } catch (err) {
    console.error("❌ 슬롯 생성 중 오류:", err.message);
  } finally {
    conn.release();
  }
}
