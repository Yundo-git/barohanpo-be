const pool = require("../../config/database");

/**
 * Authentication database model
 */
const authModel = {
  /**
   * Create a new user account
   * @param {string} email - User email
   * @param {string} password - Hashed password
   * @param {string} name - User's name
   * @param {string} phone - Phone number
   * @returns {Promise<Object>} Created user info
   */
  signup: async (email, password, name, phone) => {
    try {
      const [rows] = await pool.query(
        `INSERT INTO users 
         (email, password, name, phone, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [email, password, name, phone]
      );

      // Fetch the created user
      const [user] = await pool.query(
        `SELECT user_id as id, email, name, phone, role, created_at 
         FROM users WHERE user_id = ?`,
        [rows.insertId]
      );

      return user[0];
    } catch (error) {
      console.error("Error in authModel.signup:", error);

      // Check for duplicate email
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("이미 사용 중인 이메일입니다.");
      }

      throw new Error("회원가입 처리 중 오류가 발생했습니다.");
    }
  },

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User info or null if not found
   */
  findByEmail: async (email) => {
    try {
      const [rows] = await pool.query(
        `SELECT user_id as id, email, password, name, phone, role, created_at
         FROM users 
         WHERE email = ?`,
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error in authModel.findByEmail:", error);
      throw error;
    }
  },

  /**
   * Find user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} User info without password or null if not found
   */
  findById: async (userId) => {
    try {
      const [rows] = await pool.query(
        `SELECT user_id as id, email, name, phone, role, created_at
         FROM users 
         WHERE user_id = ?`,
        [userId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error("Error in authModel.findById:", error);
      throw error;
    }
  },

  /**
   * Store a refresh token in the database
   * @param {Object} tokenData - Token data
   * @param {string} tokenData.userId - User ID
   * @param {string} tokenData.token - Hashed refresh token
   * @param {string} tokenData.jti - JWT ID for the token
   * @param {Date} tokenData.expiresAt - Token expiration date
   * @returns {Promise<Object>} Stored token info
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
   * Find a refresh token by its JWT ID
   * @param {string} jti - JWT ID of the token
   * @returns {Promise<Object|null>} Token info or null if not found
   */
  findRefreshTokenByJti: async (jti) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, user_id as userId, token, jti, expires_at as expiresAt, 
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
   * Invalidate a refresh token by its JWT ID
   * @param {string} jti - JWT ID of the token to invalidate
   * @returns {Promise<boolean>} True if token was invalidated
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
   * Invalidate all refresh tokens for a user
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if tokens were invalidated
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
      console.error("Error in authModel.invalidateAllUserRefreshTokens:", error);
      throw error;
    }
  },

  /**
   * Clean up expired refresh tokens
   * @returns {Promise<number>} Number of tokens deleted
   */
  cleanupExpiredTokens: async () => {
    try {
      const [result] = await pool.query(
        `DELETE FROM refresh_tokens 
         WHERE expires_at < NOW() OR revoked = TRUE`
      );
      
      return result.affectedRows;
    } catch (error) {
      console.error("Error in authModel.cleanupExpiredTokens:", error);
      throw error;
    }
  },
};
