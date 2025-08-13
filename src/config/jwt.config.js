const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

// Environment variables - validation happens in TokenService
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || '7d';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate required environment variables
const requiredVars = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  const errorMsg = `Missing required environment variables: ${missingVars.join(', ')}`;
  logger.error(errorMsg);
  throw new Error(errorMsg);
}

/**
 * Generate an access token with user payload
 * @param {Object} payload - User data to include in the token
 * @param {string} [jti] - Optional JWT ID for token invalidation
 * @returns {string} JWT access token
 */
const generateAccessToken = (payload, jti) => {
  // Create a new payload object without jti if it exists
  const { jti: _, ...payloadWithoutJti } = payload;
  
  return jwt.sign(
    { 
      ...payloadWithoutJti, 
      type: 'access'
    },
    JWT_ACCESS_SECRET,
    {
      expiresIn: ACCESS_TOKEN_TTL,
      issuer: "barohanpo",
      subject: 'access',
      jwtid: jti  // Set jti in the options, not in the payload
    }
  );
};

/**
 * Generate a refresh token with user payload
 * @param {Object} payload - User data to include in the token
 * @param {string} jti - JWT ID for token invalidation
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (payload, jti) => {
  if (!jti) {
    throw new Error('jti (JWT ID) is required for refresh tokens');
  }
  
  // Create a new payload object without jti if it exists
  const { jti: _, ...payloadWithoutJti } = payload;
  
  return jwt.sign(
    { 
      ...payloadWithoutJti, 
      type: 'refresh'
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_TTL,
      issuer: "barohanpo",
      subject: 'refresh',
      jwtid: jti  // Set jti in the options, not in the payload
    }
  );
};

/**
 * Verify a JWT token
 * @param {string} token - The JWT token to verify
 * @param {boolean} isRefresh - Whether this is a refresh token
 * @returns {{success: boolean, decoded: Object|null, message: string|undefined}}
 */
const verifyToken = (token, isRefresh = false) => {
  try {
    const secret = isRefresh ? JWT_REFRESH_SECRET : JWT_ACCESS_SECRET;
    const decoded = jwt.verify(token, secret);
    
    // Verify token type matches expected
    const expectedType = isRefresh ? 'refresh' : 'access';
    if (decoded.type !== expectedType) {
      throw new Error(`Invalid token type: expected ${expectedType} token`);
    }
    
    return {
      success: true,
      decoded
    };
  } catch (error) {
    let message = 'Invalid or expired token';
    
    if (error.name === 'TokenExpiredError') {
      message = 'Token has expired';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token';
    }
    
    return {
      success: false,
      decoded: null,
      message
    };
  }
};

/**
 * Decode a JWT token without verification
 * @param {string} token - The JWT token to decode
 * @returns {Object|null} The decoded token payload or null if invalid
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

/**
 * Generate a unique token ID (jti) for token invalidation
 * @returns {string} A unique token ID
 */
const generateTokenId = () => {
  return require('crypto').randomBytes(16).toString('hex');
};

module.exports = { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyToken, 
  decodeToken, 
  generateTokenId 
};
