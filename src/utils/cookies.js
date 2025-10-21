// utils/cookies.js
export const COOKIE_NAME = "refresh_token";
// 프론트에서 /api/* 로만 백엔드 호출하므로 '/api' 로 통일.
// (예전에 '/api/auth/refresh-token' 으로 세팅했다면, 둘 다 지워주도록 clear에서 두 경로 모두 시도)
export const COOKIE_PATH = "/api";

export function setRefreshCookie(res, token) {
  const isProduction = process.env.NODE_ENV === "production";
  const domain = isProduction ? ".barohanpo.xyz" : undefined;

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    domain: ".barohanpo.xyz",
    path: COOKIE_PATH,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
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
