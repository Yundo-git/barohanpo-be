import axios from "axios";
const TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const USERINFO_URL = "https://kapi.kakao.com/v2/user/me";

async function exchangeCodeForToken({
  // 토큰 교환
  code,
  redirectUri,
  clientId,
  clientSecret,
}) {
  const body = new URLSearchParams({
    // URL 인코딩된 토큰 요청
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
  });
  if (clientSecret) body.append("client_secret", clientSecret);

  const { data } = await axios.post(TOKEN_URL, body.toString(), {
    // 토큰 요청
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data; // {access_token, refresh_token?, expires_in, scope, ...}
}

async function fetchKakaoUser(accessToken) {
  const { data } = await axios.get(USERINFO_URL, {
    // 토큰 요청
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data; // { id, kakao_account: { email, profile: { nickname, ... } } }
}

export { exchangeCodeForToken, fetchKakaoUser };
