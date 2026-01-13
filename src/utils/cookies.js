export const COOKIE_NAME = "refresh_token";
// 쿠키 경로를 루트로 설정 (모든 경로에서 접근 가능)
export const COOKIE_PATH = "/";

/**
 * HttpOnly Refresh Token 쿠키 설정
 * @param {object} res Express 응답 객체
 * @param {string} token 설정할 리프레시 토큰 값
 */
export function setRefreshCookie(res, token) {
  const isProduction = process.env.NODE_ENV === "production";

  // Note: sameSite: 'none'은 반드시 secure: true와 함께 사용되어야 합니다.
  // Vercel(FE) -> barohanpo.xyz(BE) 크로스 도메인이므로 secure: true가 필수입니다.
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction || true, // 프로덕션에서는 true, 개발에서도 안전을 위해 true 권장
    sameSite: isProduction ? "none" : "lax", // 프로덕션에서 크로스 사이트 허용, 개발은 lax
    path: COOKIE_PATH,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  // 🛑 Nginx 또는 크로스 도메인 환경에서 문제를 일으킬 가능성이 높으므로 domain 옵션을 제거합니다.
  // Express는 유효하지 않은 domain 옵션 시 쿠키 설정을 무시할 수 있습니다.
  // if (isProduction) {
  //   cookieOptions.domain = ".barohanpo.xyz";
  // }

  console.log("=== [setRefreshCookie] ===");
  console.log("Environment:", process.env.NODE_ENV);
  console.log("Cookie Name:", COOKIE_NAME);
  console.log("Cookie Options:", JSON.stringify(cookieOptions, null, 2));
  console.log("Token length:", token?.length);
  console.log("Token preview:", token?.substring(0, 30) + "...");

  res.cookie(COOKIE_NAME, token, cookieOptions);

  console.log("✅ Cookie set successfully");
  console.log("=======================");
}

/**
 * 리프레시 토큰 쿠키 제거
 * @param {object} res Express 응답 객체
 */
export function clearRefreshCookie(res) {
  // const isProduction = process.env.NODE_ENV === "production";

  const clearOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: COOKIE_PATH,
    // clearCookie는 maxAge 대신 만료일을 과거로 설정합니다.
  };

  // 🛑 쿠키 삭제 시에도 설정된 domain 옵션이 필요하므로, 설정한 적이 있다면 동일하게 제거합니다.
  // if (isProduction) {
  //   clearOptions.domain = ".barohanpo.xyz";
  // }

  // 현재 표준 경로로 삭제
  res.clearCookie(COOKIE_NAME, clearOptions);

  // 혹시 모를 이전 경로들을 삭제 시도 (이전 경로로 쿠키가 설정되어 있을 경우를 대비)
  const oldPaths = ["/api", "/api/auth/refresh-token"];
  oldPaths.forEach((oldPath) => {
    res.clearCookie(COOKIE_NAME, {
      ...clearOptions,
      path: oldPath,
    });
  });

  console.log(`[Cookie Clear] ${COOKIE_NAME}`);
}
