/**
 * @typedef {Object} User
 * @property {number} user_id - User ID
 * @property {string} email - User's email address
 * @property {string} name - User's full name
 * @property {string} phone - User's phone number
 * @property {string} [role] - User's role (e.g., 'user', 'admin')
 * @property {string} [created_at] - Timestamp when user was created
 * @property {string} [updated_at] - Timestamp when user was last updated
 */

/**
 * @typedef {Object} TokenPayload
 * @property {number} user_id - User ID
 * @property {string} email - User's email
 * @property {string} name - User's name
 * @property {string} [role] - User's role
 * @property {string} jti - JWT ID for token invalidation
 * @property {number} iat - Issued at timestamp
 * @property {number} exp - Expiration timestamp
 * @property {boolean} isRefreshToken - Whether this is a refresh token
 */

/**
 * @typedef {Object} AuthTokens
 * @property {string} accessToken - Short-lived access token
 * @property {string} refreshToken - Long-lived refresh token
 */

/**
 * @typedef {Object} LoginResponse
 * @property {User} user - Authenticated user info
 * @property {string} token - Access token
 */

/**
 * @typedef {Object} RefreshTokenResponse
 * @property {string} accessToken - New access token
 * @property {string} refreshToken - New refresh token (rotated)
 * @property {User} user - User information
 */

export {}; // This file only contains type definitions
