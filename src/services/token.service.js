// services/token.service.js
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { db } from "../config/database.js";
import { logger } from "../utils/logger.js";

import {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
} from "../config/jwt.config.js";

/** ------- 내부 유틸 ------- */
function ensureEnv() {
  if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length < 16) {
    logger.error("JWT_REFRESH_SECRET is missing or too short (min 16 chars)");
    process.exit(1);
  }
  if (!JWT_ACCESS_SECRET || JWT_ACCESS_SECRET.length < 16) {
    logger.error("JWT_ACCESS_SECRET is missing or too short (min 16 chars)");
    process.exit(1);
  }
}

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function generateTokenId() {
  // UUID도 가능하지만 프로젝트 전역에서 crypto 기반으로 통일
  return crypto.randomBytes(16).toString("hex");
}

/** ------- 핵심 동작 ------- */

/**
 * access/refresh 동시 발급 + refresh 저장
 * @param {{ user_id:number, email?:string, name?:string, role?:string, nickname?:string, phone?:string }} userPayload
 */
async function issueJwtPair(userPayload) {
  const jti = generateTokenId();

  const accessToken = jwt.sign(
    { ...userPayload, type: "access" },
    JWT_ACCESS_SECRET,
    {
      expiresIn: ACCESS_TOKEN_TTL,
      issuer: "barohanpo",
      subject: "access",
      jwtid: jti,
    }
  );

  const refreshToken = jwt.sign(
    { ...userPayload, type: "refresh" },
    JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_TTL,
      issuer: "barohanpo",
      subject: "refresh",
      jwtid: jti,
    }
  );

  const decoded = jwt.decode(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000);

  await db.execute(
    `INSERT INTO refresh_tokens (user_id, jti, token_hash, expires_at, revoked)
     VALUES (?, ?, ?, ?, 0)`,
    [userPayload.user_id, jti, sha256(refreshToken), expiresAt]
  );

  return { accessToken, refreshToken, jti, expiresAt };
}

/**
 * refresh 유효성 검증 (DB/만료/회수/해시)
 * @param {string} jti
 * @param {string} refreshJwt
 */
async function isRefreshValid(jti, refreshJwt) {
  const [rows] = await db.execute(
    `SELECT token_hash, revoked, expires_at FROM refresh_tokens WHERE jti = ? LIMIT 1`,
    [jti]
  );
  if (!rows || !rows[0]) return false;
  const { token_hash, revoked, expires_at } = rows[0];
  if (revoked) return false;
  if (new Date(expires_at) < new Date()) return false;
  return token_hash === sha256(refreshJwt);
}

/** 특정 jti 무효화 */
async function revokeByJti(jti) {
  await db.execute(
    `UPDATE refresh_tokens SET revoked = 1, revoked_at = NOW() WHERE jti = ?`,
    [jti]
  );
}

/** 유저 전부 무효화 */
async function revokeAllForUser(userId) {
  await db.execute(
    `UPDATE refresh_tokens SET revoked = 1, revoked_at = NOW() WHERE user_id = ?`,
    [userId]
  );
}

/**
 * refresh 회전: 새 쌍 발급 + DB 갱신(구 jti revoke)
 * @param {string} oldRefresh
 * @returns {{ accessToken:string, refreshToken:string, userPayload:object, newJti:string, expiresAt:Date }}
 */
async function rotateRefresh(oldRefresh) {
  let payload;
  try {
    payload = jwt.verify(oldRefresh, JWT_REFRESH_SECRET, {
      issuer: "barohanpo",
      subject: "refresh",
    });
  } catch (e) {
    throw new Error("Invalid or expired refresh token");
  }

  if (payload.type !== "refresh") throw new Error("Invalid token type");

  const valid = await isRefreshValid(payload.jti, oldRefresh);
  if (!valid) throw new Error("Invalid or expired refresh token");

  const userPayload = {
    // 통일: 우리 프로젝트는 user_id 사용
    user_id: Number(payload.user_id ?? payload.sub ?? payload.id),
    email: payload.email,
    name: payload.name,
    role: payload.role,
    nickname: payload.nickname,
    phone: payload.phone,
  };

  const {
    accessToken,
    refreshToken,
    jti: newJti,
    expiresAt,
  } = await issueJwtPair(userPayload);

  // 예전 토큰 revoke
  await revokeByJti(payload.jti);

  return { accessToken, refreshToken, userPayload, newJti, expiresAt };
}

ensureEnv();

// Export test utilities separately
export const _testOnly = {
  generateTokenId,
};

// Export main API
export {
  issueJwtPair,
  isRefreshValid,
  revokeByJti,
  revokeAllForUser,
  rotateRefresh,
  sha256,
};
