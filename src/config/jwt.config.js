import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { logger } from "../utils/logger.js";

dotenv.config();

// 환경 변수 - 유효성 검사는 TokenService에서 수행됨
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || "7d";
const NODE_ENV = process.env.NODE_ENV || "development";

// 필수 환경 변수 검증
const requiredVars = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];
const missingVars = requiredVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  const errorMsg = `필요한 환경 변수가 없습니다: ${missingVars.join(", ")}`;
  logger.error(errorMsg);
  throw new Error(errorMsg);
}

/**
 * 사용자 페이로드로 액세스 토큰 생성
 * @param {Object} payload - 토큰에 포함될 사용자 데이터
 * @param {string} [jti] - 토큰 무효화를 위한 선택적 JWT ID
 * @returns {string} JWT 액세스 토큰
 */
const generateAccessToken = (payload, jti) => {
  const { jti: _, ...payloadWithoutJti } = payload;

  return jwt.sign(
    {
      ...payloadWithoutJti,
      type: "access",
    },
    JWT_ACCESS_SECRET,
    {
      expiresIn: ACCESS_TOKEN_TTL,
      issuer: "barohanpo",
      subject: "access",
      jwtid: jti,
    }
  );
};

/**
 * 사용자 페이로드로 리프레시 토큰 생성
 * @param {Object} payload - 토큰에 포함될 사용자 데이터
 * @param {string} jti - 토큰 무효화를 위한 JWT ID
 * @returns {string} JWT 리프레시 토큰
 */
const generateRefreshToken = (payload, jti) => {
  if (!jti) {
    throw new Error("jti (JWT ID) is required for refresh tokens");
  }

  const { jti: _, ...payloadWithoutJti } = payload;

  return jwt.sign(
    {
      ...payloadWithoutJti,
      type: "refresh",
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_TTL,
      issuer: "barohanpo",
      subject: "refresh",
      jwtid: jti,
    }
  );
};

/**
 * JWT 토큰 검증
 * @param {string} token - 검증할 JWT 토큰
 * @param {boolean} isRefresh - 리프레시 토큰 여부
 * @returns {{success: boolean, decoded: Object|null, message: string|undefined}}
 */
const verifyToken = (token, isRefresh = false) => {
  try {
    const secret = isRefresh ? JWT_REFRESH_SECRET : JWT_ACCESS_SECRET;
    const decoded = jwt.verify(token, secret);

    // 토큰 유형 클레임 추가
    const expectedType = isRefresh ? "refresh" : "access";
    if (decoded.type !== expectedType) {
      throw new Error(`잘못된 토큰 유형: ${expectedType} 토큰이 예상됩니다`);
    }

    return {
      success: true,
      decoded,
    };
  } catch (error) {
    let message = "잘못된 또는 만료된 토큰";

    if (error.name === "TokenExpiredError") {
      message = "토큰이 만료되었습니다";
    } else if (error.name === "JsonWebTokenError") {
      message = "잘못된 토큰";
    }

    return {
      success: false,
      decoded: null,
      message,
    };
  }
};

/**
 * 검증 없이 JWT 토큰 디코딩
 * @param {string} token - 디코딩할 JWT 토큰
 * @returns {Object|null} 디코딩된 토큰 페이로드 또는 유효하지 않은 경우 null
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

/**
 * 토큰 무효화를 위한 고유 토큰 ID(jti) 생성
 * @returns {string} 고유한 토큰 ID
 */
const generateTokenId = () => {
  return import("crypto").then((crypto) =>
    crypto.randomBytes(16).toString("hex")
  );
};

export {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  generateTokenId,
};
