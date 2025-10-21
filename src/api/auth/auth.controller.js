import jwt from "jsonwebtoken";
import { signup as signupService, login as loginService, refreshAccessToken, getCurrentUser as getCurrentUserService, logout as logoutService, changeNick } from "./auth.service.js";
import { sendError } from "../../utils/errorHandler.js";
import { setRefreshCookie, clearRefreshCookie } from "../../utils/cookies.js";

/**
 * 회원가입
 * - refresh_token: HttpOnly 쿠키로 설정
 * - accessToken: JSON 응답(body)로만 반환
 */
const signup = async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    // nickname 은 프론트에서 안 보낼 수 있으므로 optional
    const nickname = req.body?.nickname;

    if (!email || !password || !name || !phone) {
      return sendError(res, "All fields are required", "VALIDATION_ERROR");
    }

    // 서비스는 { user, token, refreshToken } 반환
    const { user, token, refreshToken } = await signupService(
      email,
      password,
      name,
      nickname, // undefined 가능 → 서비스에서 랜덤 생성 및 중복 보정
      phone
    );

    // refresh_token 쿠키로 설정
    setRefreshCookie(res, refreshToken);

    // accessToken은 응답 바디로만
    return res.status(201).json({
      success: true,
      data: {
        user,
        accessToken: token,
      },
    });
  } catch (error) {
    console.error("회원가입 처리 중 오류:", error);

    if (error.message?.includes("already in use")) {
      return sendError(res, "Email already in use", "VALIDATION_ERROR", {
        field: "email",
      });
    }

    if (error.message?.includes("Password must be at least")) {
      return sendError(res, error.message, "VALIDATION_ERROR");
    }

    return sendError(res, "Failed to create user", "INTERNAL_ERROR");
  }
};

/**
 * 로그인
 * - refresh_token: HttpOnly 쿠키로 설정
 * - accessToken: JSON 응답(body)로만 반환
 */
const login = async (req, res) => {
  console.log("[Auth Controller] Login attempt for email:", req.body?.email);
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "이메일과 비밀번호를 모두 입력해주세요.",
      });
    }

    // 서비스는 { user, token, refreshToken } 반환
    const result = await loginService(email, password);

    // refresh_token만 쿠키로 저장 (access는 쿠키 금지)
    setRefreshCookie(res, result.refreshToken);

    // accessToken은 응답 바디로만
    return res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.token,
      },
    });
  } catch (error) {
    console.error("Error in authController.login:", error);

    // 서비스에서 안전화된 메시지를 던지면 그대로 매핑
    if (
      error.message === "존재하지 않는 이메일입니다." ||
      error.message === "비밀번호가 일치하지 않습니다." ||
      error.message === "Authentication failed"
    ) {
      return res.status(401).json({
        success: false,
        error: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }

    return res.status(500).json({
      success: false,
      error: "로그인 처리 중 오류가 발생했습니다.",
    });
  }
};

/**
 * 액세스 토큰 재발급 (토큰 로테이션 대응)
 * - 요청의 refresh_token(쿠키 또는 헤더)을 사용
 * - 새 refresh_token이 있으면 쿠키 갱신
 * - accessToken은 응답 바디로만 반환
 */
const refreshToken = async (req, res) => {
  try {

        console.log("리프레시 토큰 요청 도착");
    console.log("쿠키:", req.cookies);  // Check if cookies are present
    console.log("헤더:", req.headers);
    const refreshTokenFromReq =
      req.cookies?.refresh_token || req.headers["x-refresh-token"];
    console.log("추출된 리프레시 토큰:", refreshTokenFromReq ? "있음" : "없음");

    if (!refreshTokenFromReq) {
      return res.status(401).json({
        success: false,
        message: "리프레시 토큰이 필요합니다.",
      });
    }

    // 서비스는 { accessToken, refreshToken?(로테이션 시), user } 반환
    const result = await refreshAccessToken(refreshTokenFromReq);

    // 로테이션된 refresh_token이 있으면 쿠키 갱신
    if (result.refreshToken) {
      setRefreshCookie(res, result.refreshToken);
    }

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

/**
 * 현재 사용자 정보
 * - 인증 미들웨어에서 req.user 설정됨을 가정
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await getCurrentUserService(userId);
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
 * 로그아웃
 * - refresh_token 쿠키 제거
 * - 서버 저장소의 refresh 무효화(선택)
 */
const logout = async (req, res) => {
  try {
    const refreshTokenFromReq =
      req.cookies?.refresh_token || req.headers["x-refresh-token"];

    // 쿠키 제거 (항상 수행)
    clearRefreshCookie(res);

    // 서버 저장소 refresh 무효화
    if (refreshTokenFromReq) {
      try {
        const decoded = jwt.verify(
          refreshTokenFromReq,
          process.env.JWT_REFRESH_SECRET,
          { ignoreExpiration: true }
        );

        if (decoded?.jti) {
          await logoutService(req.user.user_id, decoded.jti);
        } else if (req.user?.user_id) {
          await logoutService(req.user.user_id);
        }
      } catch (e) {
        console.error("Error during token invalidation:", e.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Successfully logged out",
    });
  } catch (error) {
    console.error("로그아웃 중 예기치 않은 오류:", error);
    return res.status(200).json({
      success: true,
      message: "Successfully logged out",
    });
  }
};

/** 닉네임 변경 */
const changeNickController = async (req, res) => {
  const { user_id, nickname } = req.body;
  try {
    const result = await changeNick(user_id, nickname);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("닉네임 변경 중 오류:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export {
  signup,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  changeNickController as changeNick,
};
