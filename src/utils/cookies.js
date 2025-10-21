// utils/cookies.js
export const COOKIE_NAME = "refresh_token";
// 프론트에서 /api/* 로만 백엔드 호출하므로 '/api' 로 통일.
// (예전에 '/api/auth/refresh-token' 으로 세팅했다면, 둘 다 지워주도록 clear에서 두 경로 모두 시도)
export const COOKIE_PATH = "/api";

export function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: true, // HTTPS 필수
    sameSite: "none", // 크로스 도메인 허용
    domain: ".barohanpo.xyz", // 모든 서브도메인에서 접근 가능
    path: "/", // 모든 경로에서 접근 가능
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
  });
}

export function clearRefreshCookie(res) {
  // 현재 표준 경로
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
  });

  // 과거에 '/api/auth/refresh-token' 으로 세팅했던 적이 있다면, 이것도 함께 제거
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/refresh-token",
  });
}

// All exports are now named exports at the top of the file
