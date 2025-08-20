const { authModel } = require("./auth.Model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const TokenService = require("../../services/TokenService");
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
} = require("../../config/jwt.config");
const logger = require("../../utils/logger");

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
    if (
      error.message.includes("ER_DUP_ENTRY") ||
      error.message.includes("duplicate")
    ) {
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
  const correlationId = Math.random().toString(36).substring(2, 10);
  logger.debug(`[${correlationId}] Login attempt for email: ${email}`, {
    hasEmail: !!email,
    hasPassword: !!password,
  });

  try {
    // 1. Input validation
    if (typeof email !== "string" || email.trim() === "") {
      throw new Error("Email is required");
    }
    if (typeof password !== "string" || password.trim() === "") {
      throw new Error("Password is required");
    }

    // 2. Find user by email
    const user = await authModel.findByEmail(email);
    if (!user) {
      logger.warn(`[${correlationId}] Login failed: User not found`, { email });
      throw new Error("Invalid email or password");
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`[${correlationId}] Login failed: Invalid password`, {
        userId: user.id,
      });
      throw new Error("Invalid email or password");
    }

    // 4. Prepare user payload for tokens
    const userPayload = {
      user_id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    // 5. Generate token ID for refresh token rotation
    const jti = TokenService.generateUniqueTokenId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    logger.debug(`[${correlationId}] Generating tokens`, {
      userId: user.id,
      jtiLength: jti.length,
      expiresAt: expiresAt.toISOString(),
    });

    // 6. Generate tokens
    const accessToken = jwt.sign(
      { ...userPayload, type: "access" },
      JWT_ACCESS_SECRET,
      {
        expiresIn: ACCESS_TOKEN_TTL,
        issuer: "barohanpo",
        subject: "access",
        jwtid: jti,
      }
    );

    const refreshToken = jwt.sign(
      { ...userPayload, type: "refresh" },
      JWT_REFRESH_SECRET,
      {
        expiresIn: REFRESH_TOKEN_TTL,
        issuer: "barohanpo",
        subject: "refresh",
        jwtid: jti,
      }
    );

    // 7. Store refresh token in database
    await TokenService.storeRefreshToken({
      userId: user.id,
      refreshToken,
      jti,
      expiresAt,
    });

    // 8. Return user data and tokens
    const response = {
      user: {
        user_id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };

    logger.debug(`[${correlationId}] Login successful`, {
      userId: user.id,
      accessTokenLength: accessToken ? accessToken.length : 0,
      refreshTokenLength: refreshToken ? refreshToken.length : 0,
    });

    return response;
  } catch (error) {
    logger.error(`[${correlationId}] Login failed: ${error.message}`, {
      error: error.stack,
      email: email ? "provided" : "missing",
    });

    // Re-throw with sanitized error message for security
    const safeError = new Error("Authentication failed");
    safeError.status = error.status || 500;
    throw safeError;
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
  const correlationId = Math.random().toString(36).substring(2, 10);
  logger.debug(`[${correlationId}] Refresh token attempt`, {
    hasToken: !!refreshToken,
    tokenLength: refreshToken ? refreshToken.length : 0,
  });

  try {
    // 1. Input validation
    if (typeof refreshToken !== "string" || refreshToken.trim() === "") {
      throw new Error("Refresh token is required");
    }

    // 2. Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET, {
        issuer: "barohanpo",
        subject: "refresh",
      });

      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
      }
    } catch (jwtError) {
      logger.error(`[${correlationId}] JWT verification failed`, {
        error: jwtError.message,
        name: jwtError.name,
      });
      throw new Error("Invalid or expired refresh token");
    }

    // 3. Check if the token is in the database and not revoked
    const [tokens] = await db.query(
      "SELECT * FROM refresh_tokens WHERE jti = ? AND revoked = 0 AND expires_at > NOW()",
      [decoded.jti]
    );

    if (tokens.length === 0) {
      logger.warn(`[${correlationId}] Refresh token not found or revoked`, {
        jti: decoded.jti,
        userId: decoded.id,
      });
      throw new Error("Invalid or expired refresh token");
    }

    const tokenData = tokens[0];

    // 4. Verify the token hash matches
    const tokenHash = TokenService.hashToken(refreshToken);
    if (tokenHash !== tokenData.token) {
      // Token doesn't match - possible token reuse! Revoke all user's tokens
      logger.warn(`[${correlationId}] Token reuse detected`, {
        userId: decoded.id,
        jti: decoded.jti,
      });

      await db.query(
        "UPDATE refresh_tokens SET revoked = 1, revoked_at = NOW() WHERE user_id = ?",
        [decoded.id]
      );

      throw new Error("Security alert: Invalid refresh token");
    }

    // 5. Generate new tokens with a new JTI for rotation
    const newJti = TokenService.generateUniqueTokenId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const userPayload = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };

    logger.debug(`[${correlationId}] Generating new tokens`, {
      userId: decoded.id,
      newJtiLength: newJti.length,
      expiresAt: expiresAt.toISOString(),
    });

    // 6. Generate new tokens
    const newAccessToken = jwt.sign(
      { ...userPayload, type: "access" },
      JWT_ACCESS_SECRET,
      {
        expiresIn: ACCESS_TOKEN_TTL,
        issuer: "barohanpo",
        subject: "access",
        jwtid: newJti,
      }
    );

    const newRefreshToken = jwt.sign(
      { ...userPayload, type: "refresh" },
      JWT_REFRESH_SECRET,
      {
        expiresIn: REFRESH_TOKEN_TTL,
        issuer: "barohanpo",
        subject: "refresh",
        jwtid: newJti,
      }
    );

    // 7. Store the new refresh token in a transaction
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Store new token
      await TokenService.storeRefreshToken({
        userId: decoded.id,
        refreshToken: newRefreshToken,
        jti: newJti,
        expiresAt,
      });

      // Revoke the old token
      await conn.query(
        "UPDATE refresh_tokens SET revoked = 1, revoked_at = NOW() WHERE jti = ?",
        [decoded.jti]
      );

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

    logger.debug(`[${correlationId}] Token refresh successful`, {
      userId: decoded.id,
      oldJti: decoded.jti,
      newJti,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    logger.error(`[${correlationId}] Token refresh failed: ${error.message}`, {
      error: error.stack,
      hasJti: !!(error.jti || (error.decoded && error.decoded.jti)),
    });

    const safeError = new Error("Failed to refresh token");
    safeError.status = error.status || 401;
    throw safeError;
  }
};

/**
 * Logout service - invalidates the current user's refresh tokens
 * @param {number} userId - The ID of the user logging out
 * @param {string} [jti] - Optional JWT ID to invalidate a specific token
 * @returns {Promise<boolean>} True if logout was successful
 * @throws {Error} If there's an error during logout
 */
const logout = async (userId, jti) => {
  const correlationId = Math.random().toString(36).substring(2, 10);

  logger.debug(`[${correlationId}] Logout requested`, {
    userId,
    hasJti: !!jti,
    jtiLength: jti ? jti.length : 0,
  });

  // Input validation
  if (!Number.isInteger(userId) || userId <= 0) {
    const error = new Error("Invalid user ID");
    error.status = 400;
    throw error;
  }

  if (jti && (typeof jti !== "string" || jti.trim() === "")) {
    const error = new Error("Invalid JTI");
    error.status = 400;
    throw error;
  }

  try {
    if (jti) {
      // Invalidate specific token
      logger.debug(`[${correlationId}] Invalidating specific token`, { jti });

      const [result] = await db.query(
        "UPDATE refresh_tokens SET revoked = 1, revoked_at = NOW() WHERE jti = ? AND user_id = ?",
        [jti, userId]
      );

      if (result.affectedRows === 0) {
        logger.warn(`[${correlationId}] Token not found or already revoked`, {
          jti,
          userId,
        });
        // Don't throw an error - just log and continue
      }
    } else {
      // Invalidate all user's tokens
      logger.debug(`[${correlationId}] Invalidating all tokens for user`, {
        userId,
      });

      const [result] = await db.query(
        "UPDATE refresh_tokens SET revoked = 1, revoked_at = NOW() WHERE user_id = ?",
        [userId]
      );

      logger.debug(
        `[${correlationId}] Invalidated ${result.affectedRows} tokens`,
        { userId }
      );
    }

    return true;
  } catch (error) {
    logger.error(`[${correlationId}] Logout failed: ${error.message}`, {
      error: error.stack,
      userId,
      hasJti: !!jti,
    });

    const safeError = new Error("Failed to complete logout");
    safeError.status = error.status || 500;
    throw safeError;
  }
};

/**
 * Get current user's profile
 * @param {number} userId - The ID of the current user
 * @returns {Promise<Object>} User profile data without sensitive information
 * @throws {Error} If user is not found or there's an error
 */
const getCurrentUser = async (userId) => {
  const correlationId = Math.random().toString(36).substring(2, 10);

  // Input validation
  if (!Number.isInteger(userId) || userId <= 0) {
    const error = new Error("Invalid user ID");
    error.status = 400;
    throw error;
  }

  logger.debug(`[${correlationId}] Fetching user profile`, { userId });

  try {
    // Get user from database
    const [users] = await db.query(
      "SELECT id, email, name, phone, role, created_at FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      logger.warn(`[${correlationId}] User not found`, { userId });
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    const user = users[0];
    logger.debug(`[${correlationId}] User profile retrieved`, {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return user;
  } catch (error) {
    logger.error(
      `[${correlationId}] Failed to fetch user profile: ${error.message}`,
      {
        error: error.stack,
        userId,
      }
    );

    // Don't expose internal errors to the client
    const safeError = error.status
      ? error
      : new Error("Failed to fetch user profile");
    safeError.status = error.status || 500;
    throw safeError;
  }
};

/**
 * Invalidate a specific refresh token by its JTI
 * @param {string} jti - The JWT ID of the token to invalidate
 * @returns {Promise<boolean>} True if the token was successfully invalidated
 * @throws {Error} If there's an error during token invalidation
 */
const invalidateRefreshToken = async (jti) => {
  try {
    if (!jti) {
      throw new Error("JTI is required");
    }

    const result = await authModel.invalidateRefreshToken(jti);
    return result;
  } catch (error) {
    console.error("Error in authService.invalidateRefreshToken:", error);
    throw error;
  }
};

module.exports = {
  signup,
  login,
  refreshAccessToken,
  logout,
  getCurrentUser,
  invalidateRefreshToken,
};
