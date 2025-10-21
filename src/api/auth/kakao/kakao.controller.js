import axios from "axios";
import { loginOrSignupWithKakao } from "./kakao.service.js";
import { setRefreshCookie } from "../../../utils/cookies.js";

const KAKAO_AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize";
const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";

// 프론트 엔드 베이스 URL (예: http://localhost:3000)
const FRONTEND_BASE_URL =
  process.env.CLIENT_URL || "http://localhost:3000";

/** 카카오 로그인 페이지로 리다이렉트 */
function redirectToKakaoLogin(req, res) {
  console.log("[kakao.controller] loaded");

  const clientId = process.env.KAKAO_REST_API_KEY;
  const redirectUri = process.env.KAKAO_REDIRECT_URI;

  // 필요한 범위: 콘솔에서 동의항목 켜두기
  const scope = ["profile_nickname", "profile_image"].join(" ");

  if (!clientId || !redirectUri) {
    return res
      .status(500)
      .json({ success: false, message: "Kakao OAuth env is not configured" });
  }

  // next 파라미터로 로그인 후 이동할 경로를 state에 실어 보냄
  const next = typeof req.query.next === "string" ? req.query.next : "/";
  const state = encodeURIComponent(next);

  const qs = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    state,
  });

  return res.redirect(`${KAKAO_AUTHORIZE_URL}?${qs.toString()}`);
}

/** 카카오 콜백: 토큰 교환 → 우리 서비스 로그인/가입 → refresh 쿠키 세팅 → 프론트로 리다이렉트 */
async function kakaoCallback(req, res) {
  try {
    if (req.query.error) {
      return res
        .status(400)
        .send(`Kakao error: ${req.query.error_description || req.query.error}`);
    }

    const code = req.query.code;
    if (!code) return res.status(400).send("인가 코드가 없습니다.");

    const redirectUri = process.env.KAKAO_REDIRECT_URI;
    const clientId = process.env.KAKAO_REST_API_KEY;

    console.log('1. Starting Kakao token exchange...');
    console.log('   - Code:', code ? 'Received' : 'Missing');
    console.log('   - Redirect URI:', redirectUri);
    console.log('   - Client ID:', clientId ? 'Set' : 'Missing');

    // 1) 카카오 토큰 교환
    let tokenRes;
    try {
      tokenRes = await axios.post(
        KAKAO_TOKEN_URL,
        new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          redirect_uri: redirectUri,
          code,
        }),
        { 
          headers: { 
            "Content-Type": "application/x-www-form-urlencoded",
            'Accept': 'application/json'
          } 
        }
      );
      
      console.log('2. Kakao token exchange successful');
      console.log('   - Response status:', tokenRes.status);
      console.log('   - Response data keys:', Object.keys(tokenRes.data));
      
      if (!tokenRes.data.access_token) {
        console.error('   - No access_token in response:', tokenRes.data);
        throw new Error('No access_token in Kakao response');
      }
    } catch (error) {
      console.error('Kakao token exchange failed:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      throw error;
    }

    const kakaoAccessToken = tokenRes.data.access_token;
    console.log('3. Kakao access token received:', {
      token: kakaoAccessToken ? '***' + kakaoAccessToken.slice(-8) : 'None',
      expires_in: tokenRes.data.expires_in,
      refresh_token: tokenRes.data.refresh_token ? '***' + String(tokenRes.data.refresh_token).slice(-8) : 'None'
    });

    // 2) 카카오 사용자 정보
    const meRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${kakaoAccessToken}` },
    });

    // 3) 우리 서비스 로그인/회원가입 처리 (access/refresh 발급)
    const result = await loginOrSignupWithKakao(meRes.data);

    // 4) refresh 토큰은 HttpOnly 쿠키로 (access 토큰은 쿠키 금지)
    setRefreshCookie(res, result.refreshToken);
    console.log("Set refresh cookie. Path should be /api");

    // 5) 프론트로 리다이렉트 (state로 받은 next 경로가 있으면 거기로)
    const rawState =
      typeof req.query.state === "string" ? req.query.state : "/";
    const next = safeNext(decodeURIComponent(rawState)); // 오픈리다이렉트 방지
    // 프론트에서 로그인 직후 me/refresh 호출로 상태 동기화하게 함

    console.log("카카오 콜백 최종 응답:", {
      user: result.user,
      accessToken: result.accessToken,
    });
    return res.redirect(`${FRONTEND_BASE_URL}${next}?login=success`);
  } catch (error) {
    const detail =
      error.response?.data || error.message || "Unknown kakao error";
    console.error("카카오 로그인 콜백 처리 오류:", detail);
    // 실패 시 프론트 에러 페이지로 돌려보내기
    return res.redirect(`${FRONTEND_BASE_URL}/auth/error?provider=kakao`);
  }
}

/** 오픈리다이렉트 방지: 외부 URL 차단하고 항상 앱 내부 경로만 허용 */
function safeNext(next) {
  if (!next || typeof next !== "string") return "/";
  // 절대 URL 차단 (http, https)
  if (/^https?:\/\//i.test(next)) return "/";
  // 반드시 슬래시로 시작
  if (!next.startsWith("/")) return "/";
  // 너무 공격적인 경로는 기본으로
  if (next.startsWith("//")) return "/";
  return next;
}

export { redirectToKakaoLogin, kakaoCallback };
