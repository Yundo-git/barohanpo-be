import {
  findUserIdByProvider,
  createUserWithOAuth,
  upsertOAuthLink,
  getUserProfile,
} from "../kakao/oauth.model.js";
import { issueJwtPair } from "../../../services/token.service.js";
import UserProfilePhoto from "../../profile/userProfilePhoto.model.js";
import { generateRandomNickname } from "../../../utils/nicknameGenerator.js";

const PROVIDER = "naver";

/** Naver 프로필 -> 우리 유저 로그인/가입 + 토큰 발급 */
async function loginOrSignupWithNaver(naverMe) {
  // naverMe.response 형태 보정
  const res = naverMe?.response ?? {};
  const providerUserId = String(res.id);
  const email = res.email ?? null;
  // name 혹은 nickname → 없으면 랜덤 닉네임
  const nickname =
    res.nickname || res.name || `네이버${Math.floor(Math.random() * 10000)}`;
  const profileImageUrl = res.profile_image || null;

  // 1) 기존 연결 여부
  let userId = await findUserIdByProvider(PROVIDER, providerUserId);

  // 2) 최초면 유저 생성
  if (!userId) {
    userId = await createUserWithOAuth({ email, nickname });

    // 프로필 이미지 세팅 (best-effort)
    if (profileImageUrl) {
      try {
        await UserProfilePhoto.upsertProfilePhoto(userId, profileImageUrl);
      } catch (e) {
        // 실패해도 무시
        console.error("Failed to set profile image:", e);
      }
    }

    // oauth_accounts에 링크 저장
    await upsertOAuthLink({
      userId,
      provider: PROVIDER,
      providerUserId,
      scope: "name email profile_image",
    });
  } else {
    // 재로그인이라도 scope 갱신
    await upsertOAuthLink({
      userId,
      provider: PROVIDER,
      providerUserId,
      scope: "name email profile_image",
    });
  }

  // 3) 최종 유저 프로필
  const userRow = await getUserProfile(userId);
  const user = {
    user_id: userRow.user_id,
    email: userRow.email,
    name: userRow.name,
    phone: userRow.phone,
    nickname: userRow.nickname,
    role: userRow.role || "user",
    updated_at: userRow.updated_at,
  };

  // 4) access/refresh 발급
  const { accessToken, refreshToken } = await issueJwtPair({
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    role: user.role,
    nickname: user.nickname,
    phone: user.phone,
  });

  return { user, accessToken, refreshToken };
}

export { loginOrSignupWithNaver };