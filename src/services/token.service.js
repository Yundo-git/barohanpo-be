const { authModel } = require('../api/auth/auth.Model');
const { generateTokenId } = require('../config/jwt.config');

/**
 * Service for managing token operations including storage and validation
 */
class TokenService {
  /**
   * Store a refresh token in the database
   * @param {string} userId - The user ID associated with the token
   * @param {string} token - The refresh token to store
   * @param {string} jti - The JWT ID for the token
   * @returns {Promise<Object>} The stored token record
   */
  async storeRefreshToken(userId, token, jti) {
    try {
      // Hash the token before storing it
      const hashedToken = await this.hashToken(token);
      
      // Store the token in the database
      const tokenRecord = await authModel.storeRefreshToken({
        userId,
        token: hashedToken,
        jti,
        expiresAt: new Date(Date.now() + (process.env.REFRESH_TOKEN_TTL_MS || 7 * 24 * 60 * 60 * 1000)),
      });
      
      return tokenRecord;
    } catch (error) {
      console.error('Error storing refresh token:', error);
      throw new Error('Failed to store refresh token');
    }
  }

  /**
   * Invalidate a refresh token by its JWT ID
   * @param {string} jti - The JWT ID of the token to invalidate
   * @returns {Promise<boolean>} True if the token was successfully invalidated
   */
  async invalidateRefreshToken(jti) {
    try {
      if (!jti) {
        throw new Error('JTI is required to invalidate token');
      }
      
      await authModel.invalidateRefreshToken(jti);
      return true;
    } catch (error) {
      console.error('Error invalidating refresh token:', error);
      throw new Error('Failed to invalidate refresh token');
    }
  }

  /**
   * Check if a refresh token is valid
   * @param {string} token - The refresh token to validate
   * @param {string} jti - The JWT ID from the token
   * @returns {Promise<boolean>} True if the token is valid
   */
  async validateRefreshToken(token, jti) {
    try {
      if (!token || !jti) {
        return false;
      }
      
      // Get the stored token by JTI
      const storedToken = await authModel.findRefreshTokenByJti(jti);
      
      if (!storedToken || storedToken.revoked) {
        return false;
      }
      
      // Verify the token matches the stored hash
      const isValid = await this.verifyTokenHash(token, storedToken.token);
      
      return isValid;
    } catch (error) {
      console.error('Error validating refresh token:', error);
      return false;
    }
  }

  /**
   * Hash a token for secure storage
   * @private
   */
  async hashToken(token) {
    const { createHash } = await import('crypto');
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Verify a token against a stored hash
   * @private
   */
  async verifyTokenHash(token, hashedToken) {
    const { createHash } = await import('crypto');
    const hash = createHash('sha256').update(token).digest('hex');
    return hash === hashedToken;
  }

  /**
   * Generate a new token ID and ensure it's unique
   * @returns {Promise<string>} A unique token ID
   */
  async generateUniqueTokenId() {
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      const jti = generateTokenId();
      const existing = await authModel.findRefreshTokenByJti(jti);
      
      if (!existing) {
        return jti;
      }
      
      attempts++;
    }
    
    throw new Error('Failed to generate unique token ID after multiple attempts');
  }
}

const tokenService = new TokenService();

module.exports = { tokenService };
