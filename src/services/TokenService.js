const { createHash, randomUUID } = require('crypto');
const db = require('../config/database');
const logger = require('../utils/logger');

class TokenService {
  static ensureEnv() {
    if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 16) {
      logger.error('JWT_REFRESH_SECRET is missing or too short (min 16 chars)');
      process.exit(1);
    }
    
    if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 16) {
      logger.error('JWT_ACCESS_SECRET is missing or too short (min 16 chars)');
      process.exit(1);
    }
  }

  static hashToken(token) {
    if (typeof token !== 'string' || token.length === 0) {
      throw new TypeError('Token must be a non-empty string');
    }
    return createHash('sha256').update(token).digest('hex');
  }

  static generateUniqueTokenId() {
    try {
      return randomUUID();
    } catch (error) {
      logger.error('Failed to generate token ID:', error);
      throw new Error('Failed to generate secure token ID');
    }
  }

  static async storeRefreshToken({ userId, refreshToken, jti, expiresAt }) {
    const correlationId = Math.random().toString(36).substring(2, 10);
    
    // Input validation
    if (!Number.isInteger(userId) || userId <= 0) {
      const error = new Error(`[${correlationId}] Invalid user ID`);
      error.status = 400;
      throw error;
    }
    
    if (typeof jti !== 'string' || jti.length === 0) {
      const error = new Error(`[${correlationId}] Invalid JTI`);
      error.status = 400;
      throw error;
    }
    
    if (!(expiresAt instanceof Date) || isNaN(expiresAt.getTime())) {
      const error = new Error(`[${correlationId}] Invalid expiration date`);
      error.status = 400;
      throw error;
    }
    
    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      const error = new Error(`[${correlationId}] Invalid refresh token`);
      error.status = 400;
      throw error;
    }

    try {
      const tokenHash = this.hashToken(refreshToken);
      
      await db.query(
        `INSERT INTO refresh_tokens (user_id, token, jti, expires_at, revoked)
         VALUES (?, ?, ?, ?, 0)`,
        [userId, tokenHash, jti, expiresAt]
      );
      
      logger.debug(`[${correlationId}] Refresh token stored successfully`, {
        userId,
        jtiLength: jti.length,
        tokenHash: tokenHash.substring(0, 8) + '...' // Only log first 8 chars of hash
      });
      
    } catch (error) {
      logger.error(`[${correlationId}] Failed to store refresh token:`, {
        error: error.message,
        userId,
        jtiLength: jti?.length || 0,
        hasExpiresAt: !!expiresAt
      });
      
      const dbError = new Error('Failed to store refresh token');
      dbError.status = 500;
      dbError.originalError = error;
      throw dbError;
    }
  }
  
  static async revokeToken(jti) {
    if (typeof jti !== 'string' || jti.length === 0) {
      throw new Error('Invalid JTI provided for token revocation');
    }
    
    try {
      await db.query(
        'UPDATE refresh_tokens SET revoked = 1, revoked_at = NOW() WHERE jti = ?',
        [jti]
      );
    } catch (error) {
      logger.error('Failed to revoke token:', { jti, error: error.message });
      throw new Error('Failed to revoke token');
    }
  }
}

// Validate environment variables on require
TokenService.ensureEnv();

module.exports = TokenService;
