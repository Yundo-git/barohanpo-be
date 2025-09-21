import { db } from "../../config/database.js";
import { logger } from "../../utils/logger.js";
const { pool } = db;

/**
 * 인증 관련 데이터베이스 모델
 */
const authModel = {
  /**
   * 새로운 사용자 계정 생성
   * @param {string} email - 사용자 이메일
   * @param {string} password - 해시된 비밀번호
   * @param {string} name - 사용자 이름
   * @param {string} nickname - 사용자 닉네임
   * @param {string} phone - 전화번호
   * @returns {Promise<Object>} 생성된 사용자 정보
   */
  signup: async (email, password, name, nickname, phone) => {
    console.log("email", email);
    console.log("password", password);
    console.log("name", name);
    console.log("nickname", nickname);
    console.log("phone", phone);
    try {
      const [rows] = await pool.query(
        `INSERT INTO users 
         (email, password, name, nickname, phone, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [email, password, name, nickname, phone]
      );

      // 생성된 사용자 정보 조회
      const [user] = await pool.query(
        `SELECT user_id, email, name, nickname, phone, role, created_at 
         FROM users WHERE user_id = ?`,
        [rows.insertId]
      );

      return user[0];
    } catch (error) {
      console.error("Error in authModel.signup:", error);

      // 중복 이메일 확인
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("이미 사용 중인 이메일입니다.");
      }

      throw new Error("회원가입 처리 중 오류가 발생했습니다.");
    }
  },

  /**
   * 이메일로 사용자 조회
   * @param {string} email - 사용자 이메일
   * @returns {Promise<Object|null>} 사용자 정보 또는 찾을 수 없는 경우 null
   */
  findByEmail: async (email) => {
    try {
      const [rows] = await pool.query(
        `SELECT
        u.user_id, u.email, u.password, u.name, u.nickname, u.phone, u.role, u.created_at,
        upp.photo_url as profileImageUrl
      FROM users u
      LEFT JOIN user_profile_photos upp
        ON u.user_id = upp.user_id
      WHERE u.email = ?`,
     [email]
      );
      logger.info("rowsㄴㄴㄴㄴㄴㄴ", rows);

      return rows[0] || null;
    } catch (error) {
      console.error("Error in authModel.findByEmail:", error);
      throw error;
    }
  },

  /**
   * 사용자 ID로 조회
   * @param {number} userId - 사용자 ID
   * @returns {Promise<Object|null>} 비밀번호를 제외한 사용자 정보 또는 찾을 수 없는 경우 null
   */
  findById: async (userId) => {
    try {
      const [rows] = await pool.query(
        `SELECT
        u.user_id, u.email, u.name, u.nickname, u.phone, u.role, u.created_at,
        upp.photo_url as profileImageUrl
      FROM users u
      LEFT JOIN user_profile_photos upp
        ON u.user_id = upp.user_id
      WHERE u.user_id = ?`,
     [userId]
      );
      console.log("rows", rows);
      return rows[0] || null;
    } catch (error) {
      console.error("Error in authModel.findById:", error);
      throw error;
    }
  },

  /**
   * 리프레시 토큰을 데이터베이스에 저장
   * @param {Object} tokenData - 토큰 데이터
   * @param {string} tokenData.userId - 사용자 ID
   * @param {string} tokenData.token - 해시된 리프레시 토큰
   * @param {string} tokenData.jti - 토큰의 JWT ID
   * @param {Date} tokenData.expiresAt - 토큰 만료 일자
   * @returns {Promise<Object>} 저장된 토큰 정보
   */
  storeRefreshToken: async ({ userId, token, jti, expiresAt }) => {
    try {
      await pool.query(
        `INSERT INTO refresh_tokens 
         (user_id, token, jti, expires_at, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [userId, token, jti, expiresAt]
      );

      return { userId, jti, expiresAt };
    } catch (error) {
      console.error("Error in authModel.storeRefreshToken:", error);
      throw error;
    }
  },

  /**
   * JWT ID로 리프레시 토큰 조회
   * @param {string} jti - 토큰의 JWT ID
   * @returns {Promise<Object|null>} 토큰 정보 또는 찾을 수 없는 경우 null
   */
  findRefreshTokenByJti: async (jti) => {
    try {
      const [rows] = await pool.query(
        `SELECT  user_id as userId, token, jti, expires_at as expiresAt, 
                revoked, created_at as createdAt
         FROM refresh_tokens 
         WHERE jti = ?`,
        [jti]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error in authModel.findRefreshTokenByJti:", error);
      throw error;
    }
  },

  /**
   * JWT ID로 리프레시 토큰 무효화
   * @param {string} jti - 무효화할 토큰의 JWT ID
   * @returns {Promise<boolean>} 토큰이 무효화된 경우 true
   */
  invalidateRefreshToken: async (jti) => {
    try {
      const [result] = await pool.query(
        `UPDATE refresh_tokens 
         SET revoked = TRUE, revoked_at = NOW() 
         WHERE jti = ? AND revoked = FALSE`,
        [jti]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error in authModel.invalidateRefreshToken:", error);
      throw error;
    }
  },

  /**
   * 사용자의 모든 리프레시 토큰 무효화
   * @param {number} userId - 사용자 ID
   * @returns {Promise<boolean>} 토큰이 무효화된 경우 true
   */
  invalidateAllUserRefreshTokens: async (userId) => {
    try {
      const [result] = await pool.query(
        `UPDATE refresh_tokens 
         SET revoked = TRUE, revoked_at = NOW() 
         WHERE user_id = ? AND revoked = FALSE`,
        [userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error(
        "Error in authModel.invalidateAllUserRefreshTokens:",
        error
      );
      throw error;
    }
  },

  /**
   * 만료된 리프레시 토큰 정리
   * @returns {Promise<number>} 삭제된 토큰 수
   */
  cleanupExpiredTokens: async () => {
    try {
      const [result] = await pool.query(
        `DELETE FROM refresh_tokens WHERE expires_at < NOW()`
      );
      return result.affectedRows;
    } catch (error) {
      logger.error("Error cleaning up expired tokens:", error);
      throw error;
    }
  },

  /**
   * 닉네임으로 사용자 조회
   * @param {string} nickname - 조회할 사용자 닉네임
   * @returns {Promise<Object|null>} 사용자 정보 또는 찾을 수 없는 경우 null
   */
  findByNickname: async (nickname) => {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM users WHERE nickname = ?`,
        [nickname]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logger.error("Error finding user by nickname:", error);
      throw error;
    }
  },

  /**
   * 사용자의 닉네임 변경
   * @param {number} userId - 사용자 ID
   * @param {string} nickname - 변경할 닉네임
   * @returns {Promise<Object>} 업데이트된 사용자 정보
   */
  changeNickModel: async (userId, nickname) => {
    try {
      const [result] = await pool.query(
        `UPDATE users 
         SET nickname = ? 
         WHERE user_id = ?`,
        [nickname, userId]
      );

      return result;
    } catch (error) {
      console.error("Error in authModel.changeNick:", error);
      throw error;
    }
  },
};

export { authModel };
