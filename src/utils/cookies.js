// utils/cookies.js
export const COOKIE_NAME = "refresh_token";
// 쿠키 경로를 루트로 변경 (모든 /api/* 경로에서 접근 가능)
export const COOKIE_PATH = "/";

export function setRefreshCookie(res, token) {
  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: true, // HTTPS 환경에서는 항상 true
    sameSite: "none", // 크로스 사이트에서는 반드시 none
    path: COOKIE_PATH,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  // 프로덕션에서만 domain 설정
  if (isProduction) {
    cookieOptions.domain = ".barohanpo.xyz";
  }

  res.cookie(COOKIE_NAME, token, cookieOptions);
  
  console.log(`[Cookie Set] ${COOKIE_NAME} with options:`, {
    domain: cookieOptions.domain || 'localhost',
    path: cookieOptions.path,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure,
    tokenLength: token?.length,
  });
}

export function clearRefreshCookie(res) {
  const isProduction = process.env.NODE_ENV === "production";
  
  const clearOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: COOKIE_PATH,
  };

  if (isProduction) {
    clearOptions.domain = ".barohanpo.xyz";
  }

  // 현재 표준 경로로 삭제
  res.clearCookie(COOKIE_NAME, clearOptions);

  // 혹시 모를 이전 경로들도 삭제 시도
  const oldPaths = ["/api", "/api/auth/refresh-token"];
  oldPaths.forEach(oldPath => {
    res.clearCookie(COOKIE_NAME, {
      ...clearOptions,
      path: oldPath,
    });
  });
  
  console.log(`[Cookie Clear] ${COOKIE_NAME}`);
}