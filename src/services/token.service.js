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
  const logId = `[${Math.random().toString(36).slice(2, 8)}]`;
  logger.debug(`${logId} [isRefreshValid] Validating refresh token`, { jti });
  
  try {
    const [rows] = await db.execute(
      `SELECT token_hash, revoked, expires_at FROM refresh_tokens WHERE jti = ? LIMIT 1`,
      [jti]
    );

    if (!rows || !rows[0]) {
      logger.warn(`${logId} [isRefreshValid] Token not found in database`, { jti });
      return false;
    }

    const { token_hash, revoked, expires_at } = rows[0];
    const now = new Date();
    const expiryDate = new Date(expires_at);
    
    if (revoked) {
      logger.warn(`${logId} [isRefreshValid] Token has been revoked`, { jti });
      return false;
    }
    
    if (expiryDate < now) {
      logger.warn(`${logId} [isRefreshValid] Token has expired`, { 
        jti, 
        expiredAt: expiryDate.toISOString(),
        currentTime: now.toISOString()
      });
      return false;
    }

    const isValid = token_hash === sha256(refreshJwt);
    if (!isValid) {
      logger.warn(`${logId} [isRefreshValid] Token hash mismatch`, { 
        jti,
        expectedHash: token_hash,
        actualHash: sha256(refreshJwt).slice(0, 10) + '...'
      });
    } else {
      logger.debug(`${logId} [isRefreshValid] Token is valid`, { jti });
    }
    
    return isValid;
  } catch (error) {
    logger.error(`${logId} [isRefreshValid] Error validating token`, { 
      jti, 
      error: error.message,
      stack: error.stack
    });
    return false;
  }
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
  const logId = `[${Math.random().toString(36).slice(2, 8)}]`;
  logger.info(`${logId} [rotateRefresh] Starting token refresh process`);
  
  let payload;
  try {
    logger.debug(`${logId} [rotateRefresh] Verifying refresh token`);
    payload = jwt.verify(oldRefresh, JWT_REFRESH_SECRET, {
      issuer: "barohanpo",
      subject: "refresh",
    });
    logger.debug(`${logId} [rotateRefresh] Token verified successfully`, { 
      userId: payload.user_id, 
      jti: payload.jti,
      type: payload.type,
      exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : null
    });
  } catch (e) {
    logger.error(`${logId} [rotateRefresh] Token verification failed`, { 
      error: e.message,
      name: e.name,
      expiredAt: e.expiredAt,
      tokenLength: oldRefresh?.length || 0
    });
    throw new Error("Invalid or expired refresh token");
  }

  if (payload.type !== "refresh") {
    logger.error(`${logId} [rotateRefresh] Invalid token type`, { 
      expectedType: 'refresh', 
      actualType: payload.type 
    });
    throw new Error("Invalid token type");
  }

  logger.debug(`${logId} [rotateRefresh] Checking refresh token validity in DB`);
  const valid = await isRefreshValid(payload.jti, oldRefresh);
  if (!valid) {
    logger.error(`${logId} [rotateRefresh] Refresh token is invalid or expired in DB`, { 
      jti: payload.jti,
      userId: payload.user_id
    });
    throw new Error("Invalid or expired refresh token");
  }

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
  logger.debug(`${logId} [rotateRefresh] Revoking old token`, { oldJti: payload.jti });
  await revokeByJti(payload.jti);

  logger.info(`${logId} [rotateRefresh] Successfully issued new tokens`, {
    userId: userPayload.user_id,
    newJti,
    expiresAt: expiresAt.toISOString()
  });

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
