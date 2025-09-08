const axios = require("axios");
const { setRefreshCookie } = require("../../../utils/cookies");
const { loginOrSignupWithNaver } = require("./naver.service");

const NAVER_AUTHORIZE_URL = "https://nid.naver.com/oauth2.0/authorize";
const NAVER_TOKEN_URL = "https://nid.naver.com/oauth2.0/token";
const NAVER_ME_URL = "https://openapi.naver.com/v1/nid/me";

const FRONTEND_BASE_URL = process.env.CLIENT_URL || "http://localhost:3000";

function redirectToNaverLogin(req, res) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const redirectUri = process.env.NAVER_REDIRECT_URI;
  // 네이버는 scope를 공백없이 콤마 또는 공백으로 넘겨도 허용 (콘솔 설정과 일치해야 함)
  const scope = "name email profile_image"; 
  const state = encodeURIComponent(typeof req.query.next === "string" ? req.query.next : "/");

  if (!clientId || !redirectUri) {
    return res.status(500).json({ success: false, message: "Naver OAuth env is not configured" });
  }

  const qs = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
    scope,
  });

  return res.redirect(`${NAVER_AUTHORIZE_URL}?${qs.toString()}`);
}

async function naverCallback(req, res) {
  try {
    if (req.query.error) {
      return res.status(400).send(`Naver error: ${req.query.error_description || req.query.error}`);
    }

    const code = req.query.code;
    const rawState = typeof req.query.state === "string" ? req.query.state : "/";
    if (!code) return res.status(400).send("인가 코드가 없습니다.");

    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    const redirectUri = process.env.NAVER_REDIRECT_URI;

    // 1) 토큰 교환
    const tokenRes = await axios.get(NAVER_TOKEN_URL, {
      params: {
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        state: rawState,
        redirect_uri: redirectUri,
      },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const accessToken = tokenRes.data.access_token;

    // 2) 사용자 정보
    const meRes = await axios.get(NAVER_ME_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // 3) 우리 서비스 로그인/가입
    const result = await loginOrSignupWithNaver(meRes.data);

    // 4) refresh 쿠키
    setRefreshCookie(res, result.refreshToken);

    // 5) 프론트로 리다이렉트
    const next = safeNext(decodeURIComponent(rawState));
    return res.redirect(`${FRONTEND_BASE_URL}${next}?login=success`);
  } catch (error) {
    const detail = error.response?.data || error.message || "Unknown naver error";
    console.error("네이버 로그인 콜백 처리 오류:", detail);
    return res.redirect(`${FRONTEND_BASE_URL}/auth/error?provider=naver`);
  }
}

function safeNext(next) {
  if (!next || typeof next !== "string") return "/";
  if (/^https?:\/\//i.test(next)) return "/";
  if (!next.startsWith("/")) return "/";
  if (next.startsWith("//")) return "/";
  return next;
}

module.exports = { redirectToNaverLogin, naverCallback };
