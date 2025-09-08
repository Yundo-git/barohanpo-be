const {
  findUserIdByProvider,
  createUserWithOAuth,
  upsertOAuthLink,
  upsertUserProfilePhoto,
  getUserProfile,
} = require("./oauth.model");
const { fetchImageAsBuffer } = require("../../../utils/fetchImage");
const TokenService = require("../../../services/token.service");
const { generateRandomNickname } = require("../../../utils/nicknameGenerator");

/**
 * 카카오 로그인 또는 회원가입 처리
 * @param {object} kakaoProfile - 카카오에서 가져온 사용자 정보
 */
async function loginOrSignupWithKakao(kakaoProfile) {
  const provider = "kakao";
  const kakaoId = kakaoProfile.id;
  const email = kakaoProfile.kakao_account?.email ?? null;
  const nickname =
    kakaoProfile.kakao_account?.profile?.nickname || generateRandomNickname();
  const profileUrl =
    kakaoProfile.kakao_account?.profile?.profile_image_url || null;

  // 1) 기존 계정 찾기
  let userId = await findUserIdByProvider(provider, kakaoId);

  // 2) 없으면 새 유저 생성
  if (!userId) {
    userId = await createUserWithOAuth({ email, nickname });
  }

  // 3) oauth_accounts 테이블에 링크 저장/갱신
  await upsertOAuthLink({ userId, provider, providerUserId: kakaoId });

  // 4) 프로필 이미지 user_profile_photos에 저장/업데이트
  if (profileUrl) {
    try {
      const { mimeType, buffer } = await fetchImageAsBuffer(profileUrl);
      await upsertUserProfilePhoto({ userId, mimeType, buffer });
    } catch (e) {
      console.warn("카카오 프로필 이미지 동기화 실패:", e.message);
    }
  }

  // 5) 최종 유저 프로필 불러오기
  const profile = await getUserProfile(userId);

  // 6) JWT 토큰 발급
  const userPayload = {
    user_id: profile.user_id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    nickname: profile.nickname,
    phone: profile.phone,
  };
  const { accessToken, refreshToken } = await TokenService.issueJwtPair(
    userPayload
  );

  // 7) 응답 데이터 구성
  return {
    user: {
      ...profile,
      hasPhoto: Boolean(profile.hasPhoto),
      profileImageUrl: `/api/profile/photo/${profile.user_id}`, // 프론트에서 이미지 표시용
    },
    accessToken,
    refreshToken,
  };
}

module.exports = { loginOrSignupWithKakao };
