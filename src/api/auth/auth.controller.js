const authService = require("./auth.service");
const { sendError, ERROR_TYPES } = require("../../utils/errorHandler");
const jwt = require("jsonwebtoken");

/**
 * @typedef {import('./auth.types').User} User
 * @typedef {import('./auth.types').TokenPayload} TokenPayload
 * @typedef {import('./auth.types').AuthTokens} AuthTokens
 * @typedef {import('./auth.types').LoginResponse} LoginResponse
 * @typedef {import('./auth.types').RefreshTokenResponse} RefreshTokenResponse
 */
/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: 새로운 사용자 회원가입
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserSignup'
 *     responses:
 *       200:
 *         description: 성공적으로 회원가입이 완료되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: 잘못된 요청 파라미터
 *       500:
 *         description: 서버 내부 오류
 */
/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - phone
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: password123
 *               name:
 *                 type: string
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 example: 01012345678
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       description: Access token
 *       400:
 *         description: Validation error or missing required fields
 *       409:
 *         description: Email already in use
 *       500:
 *         description: Internal server error
 */
const signup = async (req, res) => {
  try {
    const { email, password, name, nickname, phone } = req.body;

    // Input validation
    if (!email || !password || !name || !phone) {
      return sendError(res, "All fields are required", "VALIDATION_ERROR");
    }

    const { user, token, refreshToken } = await authService.signup(
      email,
      password,
      name,
      nickname,
      phone
    );

    // Set HTTP-only cookie for refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/api/auth/refresh-token",
    });

    // Return user data and access token
    return res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error("Error in authController.signup:", error);

    if (error.message.includes("already in use")) {
      return sendError(res, "Email already in use", "VALIDATION_ERROR", {
        field: "email",
      });
    }

    if (error.message.includes("Validation failed")) {
      return sendError(res, error.message, "VALIDATION_ERROR");
    }

    return sendError(res, "Failed to create user", "INTERNAL_ERROR");
  }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: |
 *       Authenticates a user and returns an access token.
 *       A refresh token is set as an HTTP-only cookie.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Successfully logged in
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               description: |
 *                 HTTP-only cookie containing the refresh token.
 *                 Secure and SameSite=Strict in production.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication failed (invalid credentials)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security: []
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "이메일과 비밀번호를 모두 입력해주세요.",
      });
    }

    const result = await authService.login(email, password);

    // 토큰을 HTTP Only 쿠키로 설정
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS를 사용하는 경우 true로 설정
      maxAge: 24 * 60 * 60 * 1000, // 24시간 유효
      sameSite: "strict",
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in authController.login:", error);

    // 인증 실패 시 401 상태 코드 반환
    if (
      error.message === "존재하지 않는 이메일입니다." ||
      error.message === "비밀번호가 일치하지 않습니다."
    ) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }

    // 그 외 오류는 500 상태 코드로 반환
    res.status(500).json({
      success: false,
      error: "로그인 처리 중 오류가 발생했습니다.",
    });
  }
};
/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: |
 *       Refreshes the access token using a valid refresh token.
 *       Implements refresh token rotation for better security.
 *       The refresh token must be sent as an HTTP-only cookie.
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json: {}
 *     responses:
 *       200:
 *         description: New tokens generated successfully
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               description: |
 *                 HTTP-only cookie containing the new refresh token.
 *                 The old refresh token is invalidated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/RefreshTokenResponse'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security: []
 */
const refreshToken = async (req, res) => {
  try {
    const refreshToken =
      req.cookies?.refreshToken || req.headers["x-refresh-token"];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "리프레시 토큰이 필요합니다.",
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    // 새로운 액세스 토큰과 리프레시 토큰을 쿠키에 설정
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15분
    });

    // 새로 발급된 리프레시 토큰도 쿠키에 설정
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    // 성공시 응답 코드(200) 및 내용 반환 (액세스 토큰만 클라이언트에 반환)
    return res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (error) {
    console.error("토큰 갱신 실패:", error);
    return res.status(401).json({
      success: false,
      message: error.message || "토큰 갱신에 실패했습니다.",
    });
  }
};

//         success:
//           type: boolean
//           example: true
//         data:
//           $ref: '#/components/schemas/User'

// export { signup, login, refreshToken };

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Successfully logged out"
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
const getCurrentUser = async (req, res) => {
  try {
    // User ID is attached to req.user by the isAuthenticated middleware
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Get current user's profile
    const user = await authService.getCurrentUser(userId);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error in authController.getCurrentUser:", error);

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
    });
  }
};

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Successfully logged out"
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *       500:
 *         description: Internal server error
 */
const logout = async (req, res) => {
  try {
    // Get the refresh token from cookies
    const refreshToken = req.cookies?.refreshToken;

    // Clear the refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth/refresh-token",
    });

    // Invalidate the refresh token if it exists
    if (refreshToken) {
      try {
        // Verify the token to get the JTI
        const decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET,
          { ignoreExpiration: true } // We still want to decode even if expired
        );

        // If we have a JTI, invalidate just this token
        if (decoded?.jti) {
          await authService.invalidateRefreshToken(decoded.jti);
        } else if (req.user?.user_id) {
          // If we can't get the JTI but have user ID, invalidate all user's tokens
          await authService.logout(req.user.user_id);
        }
      } catch (error) {
        // Log the error but don't fail the logout
        console.error("Error during token invalidation:", error.message);
      }
    }

    // Always return success
    return res.status(200).json({
      success: true,
      message: "Successfully logged out",
    });
  } catch (error) {
    console.error("Unexpected error during logout:", error);
    return res.status(200).json({
      success: true,
      message: "Successfully logged out",
    });
  }
};

module.exports = {
  signup,
  login,
  refreshToken,
  logout,
  getCurrentUser,
};
