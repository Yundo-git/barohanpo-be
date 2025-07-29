import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

// Access Token 생성
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
    issuer: "barohanpo",
  });
};

// Refresh Token 생성
const generateRefreshToken = (payload) => {
  return jwt.sign(
    { ...payload, isRefreshToken: true },
    JWT_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: "barohanpo",
    }
  );
};

// JWT 토큰 검증
const verifyToken = (token, isRefreshToken = false) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 리프레시 토큰인지 확인
    if (isRefreshToken && !decoded.isRefreshToken) {
      throw new Error('Invalid token type');
    }
    
    return {
      success: true,
      decoded,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

// 토큰 디코딩 (만료 여부와 상관없이)
const decodeToken = (token) => {
  return jwt.decode(token);
};

export { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyToken, 
  decodeToken 
};
