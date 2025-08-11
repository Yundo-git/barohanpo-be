const { authModel } = require("./auth.Model");
const bcrypt = require("bcryptjs");
const { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyToken,
  generateTokenId
} = require("../../config/jwt.config");
const { tokenService } = require("../../services/token.service");

/**
 * @typedef {import('./auth.types').User} User
 * @typedef {import('./auth.types').TokenPayload} TokenPayload
 * @typedef {import('./auth.types').AuthTokens} AuthTokens
 * @typedef {import('./auth.types').LoginResponse} LoginResponse
 * @typedef {import('./auth.types').RefreshTokenResponse} RefreshTokenResponse
 */

/**
 * User signup service
 * @param {string} email - User email
 * @param {string} password - Password (min 8 chars)
 * @param {string} name - User's name
 * @param {string} phone - Phone number (without hyphens)
 * @returns {Promise<User>} Created user info without sensitive data
 * @throws {Error} Error during signup process
 */
const signup = async (email, password, name, phone) => {
  try {
    // Input validation
    if (!email || !password || !name || !phone) {
      throw new Error("All fields are required");
    }

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with hashed password
    const user = await authModel.signup(email, hashedPassword, name, phone);
    return user;
  } catch (error) {
    console.error("Error in authService.signup:", error);
    
    // Handle duplicate email error
    if (error.message.includes("ER_DUP_ENTRY") || error.message.includes("duplicate")) {
      throw new Error("Email already in use");
    }
    
    throw error;
  }
};

/**
 * User login service
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<LoginResponse>} User info and auth tokens
 * @throws {Error} If login fails with message indicating the reason
 */
const login = async (email, password) => {
  try {
    // 1. Find user by email
    const user = await authModel.findByEmail(email);
    
    // 2. Check if user exists
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // 4. Generate tokens
    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    // 5. Generate token ID for refresh token rotation
    const jti = await tokenService.generateUniqueTokenId();
    
    // 6. Generate tokens with jti
    const accessToken = generateAccessToken(userPayload, jti);
    const refreshToken = generateRefreshToken(userPayload, jti);
    
    // 7. Store refresh token in database
    await tokenService.storeRefreshToken({
      userId: user.id,
      token: refreshToken,
      jti,
      expiresAt: new Date(Date.now() + (process.env.REFRESH_TOKEN_TTL_MS || 7 * 24 * 60 * 60 * 1000))
    });

    // 8. Return user info (without password) and tokens
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken
    };
  } catch (error) {
    console.error("Error in authService.login:", error);
    throw error;
  }
};

/**
 * Refresh access token using a valid refresh token
 * Implements refresh token rotation for better security
 * @param {string} refreshToken - The refresh token from cookie
 * @returns {Promise<{accessToken: string, refreshToken: string}>} New tokens
 * @throws {Error} If refresh token is invalid or expired
 */
const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("Refresh token is required");
  }

  // 1. Verify the refresh token
  const { success, decoded, message } = verifyToken(refreshToken, true);
  
  if (!success || !decoded) {
    throw new Error(message || "Invalid refresh token");
  }

  // 2. Check if the token has been revoked or is still valid in the database
  const isValidToken = await tokenService.validateRefreshToken(refreshToken, decoded.jti);
  if (!isValidToken) {
    throw new Error("Invalid or expired refresh token");
  }

  // 3. Get user from database to ensure they still exist and have valid permissions
  const user = await authModel.findById(decoded.id);
  if (!user) {
    throw new Error("User not found");
  }

  // 4. Invalidate the current refresh token (one-time use)
  await tokenService.invalidateRefreshToken(decoded.jti);

  // 5. Prepare user payload for new tokens
  const userPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };

  // 6. Generate new token ID for the new refresh token
  const newJti = await tokenService.generateUniqueTokenId();
  
  // 7. Generate new tokens
  const newAccessToken = generateAccessToken(userPayload, newJti);
  const newRefreshToken = generateRefreshToken(userPayload, newJti);
  
  // 8. Store the new refresh token in the database
  await tokenService.storeRefreshToken({
    userId: user.id,
    token: newRefreshToken,
    jti: newJti,
    expiresAt: new Date(Date.now() + (process.env.REFRESH_TOKEN_TTL_MS || 7 * 24 * 60 * 60 * 1000))
  });

  // 9. Return the new tokens
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
};

/**
 * Logout service - invalidates the current user's refresh tokens
 * @param {string} userId - The ID of the user logging out
 * @param {string} [jti] - Optional JWT ID to invalidate a specific token
 * @returns {Promise<boolean>} True if logout was successful
 * @throws {Error} If there's an error during logout
 */
const logout = async (userId, jti) => {
  try {
    if (!userId) {
      throw new Error('User ID is required for logout');
    }

    // If a specific token JTI is provided, invalidate just that token
    if (jti) {
      await tokenService.invalidateRefreshToken(jti);
      return true;
    }
    
    // Otherwise, invalidate all refresh tokens for the user
    await authModel.invalidateAllUserRefreshTokens(userId);
    return true;
  } catch (error) {
    console.error('Error in authService.logout:', error);
    throw error;
  }
};

/**
 * Get current user's profile
 * @param {number} userId - The ID of the current user
 * @returns {Promise<Object>} User profile data without sensitive information
 * @throws {Error} If user is not found or there's an error
 */
const getCurrentUser = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get user from database
    const user = await authModel.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Remove sensitive information
    const { password, ...userWithoutPassword } = user;
    
    return userWithoutPassword;
  } catch (error) {
    console.error('Error in authService.getCurrentUser:', error);
    throw error;
  }
};

module.exports = { 
  signup, 
  login, 
  refreshAccessToken, 
  logout,
  getCurrentUser,
  invalidateRefreshToken
};
