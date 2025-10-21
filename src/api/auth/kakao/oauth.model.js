// api/auth/kakao/oauth.model.js
import { db } from "../../../config/database.js";
const { pool } = db;

/** provider + provider_user_id로 기존 유저 조회 */
async function findUserIdByProvider(provider, providerUserId) {
  const [rows] = await pool.execute(
    `SELECT u.user_id
       FROM oauth_accounts oa
       JOIN users u ON u.user_id = oa.user_id
      WHERE oa.provider = ? AND oa.provider_user_id = ?
      LIMIT 1`,
    [provider, String(providerUserId)]
  );
  return rows[0]?.user_id ?? null;
}

/** 소셜 최초 로그인 시 유저 생성 */
async function createUserWithOAuth({ email, nickname }) {
  const [result] = await pool.execute(
    `INSERT INTO users (name, nickname, email, password, role)
     VALUES (?, ?, ?, '', 'user')`,
    [nickname || "kakao_user", nickname || "kakao_user", email ?? null]
  );
  return Number(result.insertId);
}

/** oauth_accounts 링크 저장/갱신 */
async function upsertOAuthLink({ userId, provider, providerUserId }) {
  await pool.execute(
    `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, connected_at)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE connected_at = CURRENT_TIMESTAMP`,
    [userId, provider, String(providerUserId)]
  );
}

/** 프로필 사진 저장/업데이트 (BLOB) */
async function upsertUserProfilePhoto({ userId, mimeType, buffer }) {
  // user_id UNIQUE 라고 가정 (없다면 REPLACE INTO 사용해도 됨)
  await pool.execute(
    `INSERT INTO user_profile_photos (user_id, mime_type)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE mime_type = VALUES(mime_type),
                             `,
    [userId, mimeType]
  );
}

/** 유저 프로필 + 사진 유무 조회 */
async function getUserProfile(userId) {
  const [rows] = await pool.execute(
    `SELECT u.user_id, u.email, u.name, u.phone, u.nickname, u.role, u.created_at,
            CASE WHEN upp.user_id IS NULL THEN 0 ELSE 1 END AS hasPhoto
       FROM users u
  LEFT JOIN user_profile_photos upp ON upp.user_id = u.user_id
      WHERE u.user_id = ?
      LIMIT 1`,
    [userId]
  );
  return rows[0] ?? null;
}

export {
  findUserIdByProvider,
  createUserWithOAuth,
  upsertOAuthLink,
  upsertUserProfilePhoto,
  getUserProfile,
};
