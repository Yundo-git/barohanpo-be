import * as authService from "./auth.servise.js";
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
export const signup = async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    console.log("auth controller >> ", req.body);
    const { user, token, refreshToken } = await authService.signup(
      email,
      password,
      name,
      phone
    );

    // HTTP-only 쿠키로 리프레시 토큰 설정
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS에서만 전송
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    // 액세스 토큰은 클라이언트에서 관리하도록 응답 본문에 포함
    res.json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error("Error in authController.signup:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: 사용자 로그인
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
 *                 description: 사용자 이메일
 *               password:
 *                 type: string
 *                 description: 비밀번호
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       description: JWT 인증 토큰
 *       400:
 *         description: 잘못된 요청 파라미터
 *       401:
 *         description: 인증 실패 (이메일 또는 비밀번호 불일치)
 *       500:
 *         description: 서버 내부 오류
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "이메일과 비밀번호를 모두 입력해주세요.",
      });
    }

    const result = await authService.login(email, password);

    // 토큰을 HTTP Only 쿠키로 설정 (선택사항)
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
 *     summary: 액세스 토큰 갱신
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 토큰이 성공적으로 갱신되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: 유효하지 않은 리프레시 토큰
 *       500:
 *         description: 서버 내부 오류
 */
export const refreshToken = async (req, res) => {
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

    // 응답 반환 (액세스 토큰만 클라이언트에 반환)
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

// @swagger
// components:
//   schemas:
//     UserSignup:
//       type: object
//       required:
//         - email
//         - password
//         - name
//         - phone
//       properties:
//         email:
//           type: string
//           format: email
//           example: user@example.com
//         password:
//           type: string
//           format: password
//           minLength: 8
//           example: password123
//         name:
//           type: string
//           example: 홍길동
//         phone:
//           type: string
//           example: 01012345678
//     ApiResponse:
//       type: object
//       properties:
//         success:
//           type: boolean
//           example: true
//         data:
//           $ref: '#/components/schemas/User'

// export { signup, login, refreshToken };

export const logout = async (req, res) => {
  try {
    // 리프레시 토큰 쿠키 삭제
    res.clearCookie("refreshToken");

    return res.status(200).json({
      success: true,
      message: "로그아웃이 완료되었습니다.",
    });
  } catch (error) {
    console.error("로그아웃 실패:", error);
    return res.status(500).json({
      success: false,
      message: "로그아웃 처리 중 오류가 발생했습니다.",
    });
  }
};
