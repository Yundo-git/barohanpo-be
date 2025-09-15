import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { authModel } from "./auth.Model.js";
import UserProfilePhoto from "../profile/userProfilePhoto.model.js";
import * as TokenService from "../../services/token.service.js";
// DB & Logger
import { db } from "../../config/database.js";
const { pool } = db;
import { logger } from "../../utils/logger.js";

// 토큰 전용 서비스
import { issueJwtPair, rotateRefresh, revokeByJti, revokeAllForUser } from "../../services/token.service.js";

// 랜덤 닉네임 유틸
import { generateRandomNickname } from "../../utils/nicknameGenerator.js";

/**
 * 공용: DB row → API 응답용 사용자 객체로 정규화
 */
function toPublicUser(row) {
  if (!row) return null;
  
  return {
    user_id: Number(row.user_id || row.id),
    email: row.email || null,
    name: row.name || null,
    phone: row.phone || null,
    nickname: row.nickname || null,
    role: row.role || 'user',
    profileImageUrl: row.photo_url || row.profileImageUrl || null,
    profileImageVersion: row.photo_version || row.profileImageVersion || null,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || row.created_at || new Date().toISOString()
  };
}

/**
 * 회원가입
 * - 사용자 생성
 * - 기본 프로필 이미지 세팅
 * - access/refresh 발급 및 저장
 */
async function signup(email, password, name, nickname, phone) {
  if (!email || !password || !name || !phone) {
    throw new Error("All fields are required");
  }
  if (String(password).length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  // 비밀번호 해시
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 닉네임 없으면 랜덤 생성
  let finalNickname = nickname;
  if (!finalNickname) {
    let attempts = 0;
    let unique = false;

    while (!unique && attempts < 5) {
      const candidate = generateRandomNickname();
      const existing = await authModel.findByNickname(candidate);
      if (!existing) {
        finalNickname = candidate;
        unique = true;
      }
      attempts++;
    }

    if (!finalNickname) {
      throw new Error("Failed to generate unique nickname");
    }
  }

  // 사용자 생성
  const user = await authModel.signup(
    email,
    hashedPassword,
    name,
    finalNickname,
    phone
  );

  // 기본 프로필 이미지 세팅 (실패해도 무시)
  try {
    const frontendBaseUrl = process.env.FRONT_PUBLIC_BASE_URL;
    if (frontendBaseUrl) {
      const defaultImageUrl = `${frontendBaseUrl}/sample_profile.jpeg`;
      try {
        await UserProfilePhoto.createProfilePhotoFromUrl(
          user.user_id,
          defaultImageUrl
        );
        logger.info(
          `Default profile image set from URL for user ${user.user_id}`
        );
      } catch (e) {
        logger.warn(
          `Profile image from URL failed, fallback to local. ${e.message}`
        );
        await UserProfilePhoto.createDefaultProfilePhoto(user.user_id);
      }
    } else {
      await UserProfilePhoto.createDefaultProfilePhoto(user.user_id);
    }
  } catch (e) {
    logger.error(
      `Error setting default profile image for user ${user.user_id}: ${e.message}`
    );
  }

  // 토큰 발급
  const userPayload = {
    user_id: Number(user.user_id),
    email: user.email,
    name: user.name,
    role: user.role,
    nickname: user.nickname,
    phone: user.phone,
  };
  const { accessToken, refreshToken } = await TokenService.issueJwtPair(
    userPayload
  );

  return {
    user: toPublicUser(user),
    token: accessToken,
    refreshToken,
  };
}

/**
 * 로그인
 */
async function login(email, password) {
  const correlationId = Math.random().toString(36).slice(2, 10);
  logger.debug(`[${correlationId}] Login attempt`, { emailProvided: !!email });

  if (!email || !password) {
    throw new Error("Invalid email or password");
  }

  const user = await authModel.findByEmail(email);
  if (!user) {
    logger.warn(`[${correlationId}] User not found`);
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    logger.warn(`[${correlationId}] Invalid password`, {
      userId: user.user_id,
    });
    throw new Error("Invalid email or password");
  }

  const userPayload = {
    user_id: Number(user.user_id),
    email: user.email,
    name: user.name,
    role: user.role,
    nickname: user.nickname,
    phone: user.phone,
  };

  const { accessToken, refreshToken } = await issueJwtPair(
    userPayload
  );

  logger.debug(`[${correlationId}] Login success`, {
    userId: user.user_id,
    accessLen: accessToken.length,
    refreshLen: refreshToken.length,
  });

  return {
    user: toPublicUser(user),
    token: accessToken,
    refreshToken,
  };
}

/**
 * 리프레시 토큰으로 액세스 재발급
 */
async function refreshAccessToken(refreshToken) {
  const correlationId = Math.random().toString(36).slice(2, 10);
  logger.debug(`[${correlationId}] Refresh attempt`, {
    hasToken: !!refreshToken,
    len: refreshToken ? refreshToken.length : 0,
  });

  if (!refreshToken || typeof refreshToken !== "string") {
    const e = new Error("Refresh token is required");
    e.status = 400;
    throw e;
  }

  const {
    accessToken,
    refreshToken: rotated,
    userPayload,
  } = await TokenService.rotateRefresh(refreshToken);

  const [rows] = await pool.query(
    `SELECT 
       user_id, email, name, phone, role, nickname, created_at
     FROM users
     WHERE user_id = ? LIMIT 1`,
    [userPayload.user_id]
  );
  const userRow = rows && rows[0] ? rows[0] : userPayload;

  return {
    accessToken,
    refreshToken: rotated,
    user: toPublicUser(userRow),
  };
}

/**
 * 로그아웃
 */
async function logout(userId, jti) {
  const uid = Number(userId);
  if (!Number.isInteger(uid) || uid <= 0) {
    const e = new Error("Invalid user ID");
    e.status = 400;
    throw e;
  }

  if (jti && typeof jti === "string" && jti.trim().length > 0) {
    await TokenService.revokeByJti(jti);
  } else {
    await TokenService.revokeAllForUser(uid);
  }
  return true;
}

/**
 * 현재 사용자 정보
 */
async function getCurrentUser(userId) {
  const uid = Number(userId);
  if (!Number.isInteger(uid) || uid <= 0) {
    const e = new Error("Invalid user ID");
    e.status = 400;
    throw e;
  }

  const [rows] = await pool.query(
    `SELECT u.user_id, u.email, u.name, u.phone, u.role, u.nickname, u.created_at,
    upp.photo_url AS profileImageUrl 
    FROM users u 
    LEFT JOIN user_profile_photos upp ON u.user_id = upp.user_id WHERE u.user_id = ? LIMIT 1`,
    [uid]
  );

  if (!rows || rows.length === 0) {
    const e = new Error("User not found");
    e.status = 404;
    throw e;
  }

  return toPublicUser(rows[0]);
}

/**
 * 특정 JTI 무효화
 */
async function invalidateRefreshToken(jti) {
  if (!jti || typeof jti !== "string") {
    const e = new Error("JTI is required");
    e.status = 400;
    throw e;
  }
  await TokenService.revokeByJti(jti);
  return true;
}

/**
 * 닉네임 변경
 */
async function changeNickService(userId, nickname) {
  return authModel.changeNickModel(userId, nickname);
}

export {
  signup,
  login,
  refreshAccessToken,
  logout,
  getCurrentUser,
  invalidateRefreshToken,
  changeNickService as changeNick,
};
