const {
    findUserIdByProvider,
    createUserWithOAuth,
    upsertOAuthLink,
    getUserProfile,
  } = require("../kakao/oauth.model");
  const TokenService = require("../../../services/token.service");
  const UserProfilePhoto = require("../../profile/userProfilePhoto.Model");
  const { generateNickname } = require("../../../utils/nicknameGenerator"); // 이미 사용중인 util
  
  const PROVIDER = "naver";
  
  /** Naver 프로필 -> 우리 유저 로그인/가입 + 토큰 발급 */
  async function loginOrSignupWithNaver(naverMe) {
    // naverMe.response 형태 보정
    const res = naverMe?.response ?? {};
    const providerUserId = String(res.id);
    const email = res.email ?? null;
    // name 혹은 nickname → 없으면 랜덤 닉네임
    const nickname =
      res.nickname || res.name || generateNickname("네이버") /* prefix optional */;
    const profileImageUrl = res.profile_image || null;
  
    // 1) 기존 연결 여부
    let userId = await findUserIdByProvider(PROVIDER, providerUserId);
  
    // 2) 최초면 유저 생성
    if (!userId) {
      userId = await createUserWithOAuth({ email, nickname });
  
      // 프로필 이미지 세팅 (best-effort)
      if (profileImageUrl) {
        try {
          await UserProfilePhoto.createProfilePhotoFromUrl(userId, profileImageUrl);
        } catch (e) {
          // 실패해도 무시
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
    const { accessToken, refreshToken } = await TokenService.issueJwtPair({
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role,
      nickname: user.nickname,
      phone: user.phone,
    });
  
    return { user, accessToken, refreshToken };
  }
  
  module.exports = { loginOrSignupWithNaver };
  