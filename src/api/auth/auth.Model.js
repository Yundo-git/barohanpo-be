import pool from "../../config/database.js";

/**
 * 인증 관련 데이터베이스 모델
 */
export const authModel = {
  /**
   * 사용자 회원가입 처리
   * @param {string} email - 사용자 이메일
   * @param {string} password - 암호화된 비밀번호
   * @param {string} name - 사용자 이름
   * @param {string} phone - 전화번호
   * @returns {Promise<Object>} 생성된 사용자 정보
   * @throws {Error} 데이터베이스 오류 발생 시
   */
  signup: async (email, password, name, phone) => {
    try {
      const [rows] = await pool.query(
        `INSERT INTO users 
         (email, password, name, phone, created_at, updated_at) 
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [email, password, name, phone]
      );

      // 생성된 사용자 정보 조회
      const [user] = await pool.query(
        "SELECT id, email, name, phone, created_at, updated_at FROM users WHERE id = ?",
        [rows.insertId]
      );

      return user[0];
    } catch (error) {
      console.error("Error in authModel.signup:", error);

      // 중복 이메일 체크
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("이미 사용 중인 이메일입니다.");
      }

      throw new Error("회원가입 처리 중 오류가 발생했습니다.");
    }
  },

  login: async (email, password) => {
    try {
      const [rows] = await pool.query(
        `SELECT  email, password
         FROM users 
         WHERE email = ? AND password = ?`,
        [email, password]
      );
      console.log("rows", rows);
      if (rows.length === 0) {
        return false;
      } else {
        return rows[0];
      }
    } catch (error) {
      console.error("Error in authModel.login:", error);
      throw error;
    }
  },
};
