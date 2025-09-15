import dayjs from "dayjs";
import { db } from "../config/database.js";
const { pool } = db;

// 운영 시간: 09:00 ~ 12:00, 14:00 ~ 17:00 (점심시간 12:00 ~ 14:00 제외)
const TIME_SLOTS = [
  "09:00:00", "10:00:00", "11:00:00",  // 오전 타임
  "14:00:00", "15:00:00", "16:00:00"   // 오후 타임
];

class SlotManager {
  constructor() {
    this.isRunning = false;
    this.cleanupInterval = null;
  }

  /**
   * 슬롯 생성을 시작합니다.
   * @param {number} [daysToGenerate=7] - 생성할 일수 (기본 7일)
   */
  async start(daysToGenerate = 7) {
    if (this.isRunning) {
      console.log('Slot manager is already running');
      return;
    }

    this.isRunning = true;
    
    try {
      // 시작 시 즉시 한 번 실행 (기존 슬롯 정리 + 새 슬롯 생성)
      await this.cleanupAndGenerate();
      
      // 매일 자정에 실행되도록 스케줄 설정
      this.scheduleDailyCleanup();
      
      console.log('Slot manager started successfully');
    } catch (error) {
      console.error('Failed to start slot manager:', error);
      this.isRunning = false;
    }
  }

  /**
   * 매일 자정에 실행될 작업을 스케줄링합니다.
   */
  scheduleDailyCleanup() {
    // 다음 자정까지의 시간 계산
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    
    const msUntilMidnight = midnight - now;
    
    // 자정이 지난 후 첫 실행
    setTimeout(() => {
      this.cleanupAndGenerate();
      // 이후 24시간마다 반복
      this.cleanupInterval = setInterval(
        () => this.cleanupAndGenerate(),
        24 * 60 * 60 * 1000 // 24시간
      );
    }, msUntilMidnight);
  }

  /**
   * 슬롯 정리 및 생성을 수행합니다.
   */
  async cleanupAndGenerate() {
    console.log('\n=== Starting slot cleanup and generation ===');
    // console.log(`Current time: ${new Date().toISOString()}`);
    
    try {
      // 1. 오늘 이전의 모든 슬롯 삭제
      console.log('\n[Step 1] Cleaning up old slots...');
      await this.cleanupOldSlots();
      
      // 2. 7일치 슬롯 생성
      console.log('\n[Step 2] Generating new slots...');
      await this.generateSlots(7);
      
      console.log('\n=== Slot cleanup and generation completed successfully ===');
    } catch (error) {
      console.error('Error during slot cleanup and generation:', error);
    }
  }

  /**
   * 오늘 이전의 모든 슬롯을 삭제합니다.
   */
  async cleanupOldSlots() {
    const conn = await pool.getConnection();
    try {
      // 오늘 날짜를 자정으로 설정
      const today = dayjs().startOf('day').format('YYYY-MM-DD');
      console.log(`[CLEANUP] Deleting all slots before ${today}`);
      
      // 삭제할 슬롯 수 확인
      const [oldSlots] = await conn.query(
        `SELECT COUNT(*) as count FROM reservation_slot WHERE DATE(slot_date) < ?`,
        [today]
      );
      console.log(`[CLEANUP] Found ${oldSlots[0].count} slots to delete`);
      
      if (oldSlots[0].count === 0) {
        console.log('[CLEANUP] No old slots to delete');
        return;
      }
      
      // 모든 오늘 이전 슬롯 삭제
      const [result] = await conn.query(
        `DELETE FROM reservation_slot 
         WHERE DATE(slot_date) < ?`,
        [today]
      );
      
      console.log(`[CLEANUP] Successfully deleted ${result.affectedRows} old slots`);
      
      // 삭제 후 확인
      const [remaining] = await conn.query(
        `SELECT COUNT(*) as count FROM reservation_slot WHERE DATE(slot_date) < ?`,
        [today]
      );
      
      if (remaining[0].count > 0) {
        console.warn(`[WARNING] ${remaining[0].count} old slots still remain after cleanup`);
      }
    } catch (error) {
      console.error('Error cleaning up old slots:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * 새로운 슬롯을 생성합니다.
   * @param {number} daysToGenerate - 생성할 일수
   */
  async generateSlots(daysToGenerate) {
    console.log(`\n[generateSlots] Starting to generate slots for ${daysToGenerate} days`);
    const conn = await pool.getConnection();
    
    try {
      const today = dayjs();
      const slotDates = Array.from({ length: daysToGenerate }, (_, i) =>
        today.add(i, 'day').format('YYYY-MM-DD')
      );
      console.log(`[generateSlots] Date range: ${slotDates[0]} to ${slotDates[slotDates.length - 1]}`);

      // 모든 약국 조회
      console.log('[generateSlots] Fetching pharmacies...');
      const [pharmacies] = await conn.query("SELECT p_id FROM pharmacy");
      console.log(`[generateSlots] Found ${pharmacies.length} pharmacies`);
      let totalSlotsGenerated = 0;

      for (const { p_id } of pharmacies) {
        // console.log(`\n[generateSlots] Processing pharmacy ID: ${p_id}`);
        
        // 이미 생성된 날짜 조회
        // console.log(`[generateSlots] Checking existing slots for pharmacy ${p_id}...`);
        const [existingDatesRows] = await conn.query(
          `SELECT DISTINCT slot_date FROM reservation_slot 
           WHERE p_id = ? AND slot_date BETWEEN ? AND ?`,
          [p_id, slotDates[0], slotDates[slotDates.length - 1]]
        );

        const existingDates = new Set(
          existingDatesRows.map(row => dayjs(row.slot_date).format('YYYY-MM-DD'))
        );
        // console.log(`[generateSlots] Found ${existingDates.size} existing dates for pharmacy ${p_id}`);

        // 생성되지 않은 날짜만 필터링
        const datesToInsert = slotDates.filter(date => !existingDates.has(date));
        // console.log(`[generateSlots] Will generate slots for ${datesToInsert.length} new dates`);

        // 새로운 슬롯 생성
        let slotsGenerated = 0;
        for (const date of datesToInsert) {
          for (const time of TIME_SLOTS) {
            try {
              const [result] = await conn.query(
                `INSERT IGNORE INTO reservation_slot 
                 (p_id, slot_date, slot_time, is_available, created_at)
                 VALUES (?, ?, ?, TRUE, NOW())`,
                [p_id, date, time]
              );
              if (result.affectedRows > 0) {
                slotsGenerated++;
              }
            } catch (error) {
              console.error(`[ERROR] Failed to insert slot for pharmacy ${p_id}, date ${date}, time ${time}:`, error.message);
            }
          }
        }

        totalSlotsGenerated += datesToInsert.length * TIME_SLOTS.length;
        // console.log(`Generated slots for pharmacy ${p_id}: ${slotsGenerated} slots (${datesToInsert.length} days)`);
      }

      console.log(`Total slots generated: ${totalSlotsGenerated}`);
      return totalSlotsGenerated;
    } catch (error) {
      console.error('Error generating slots:', error);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * 슬롯 매니저를 중지합니다.
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.isRunning = false;
    console.log('Slot manager stopped');
  }
}

// 싱글톤 인스턴스 생성
const slotManager = new SlotManager();

export default slotManager;
