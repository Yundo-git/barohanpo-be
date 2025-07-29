import { authModel } from "./auth.Model.js";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "../../config/jwt.config.js";

/**
 * 사용자 회원가입 서비스
 * @param {string} email - 사용자 이메일
 * @param {string} password - 비밀번호 (8자 이상)
 * @param {string} name - 사용자 이름
 * @param {string} phone - 전화번호 (하이픈 제외)
 * @returns {Promise<Object>} 생성된 사용자 정보
 * @throws {Error} 회원가입 과정에서 발생한 에러
 */
export const signup = async (email, password, name, phone) => {
  try {
    // 입력값 검증
    if (!email || !password || !name || !phone) {
      throw new Error("필수 입력값이 누락되었습니다.");
    }

    if (password.length < 8) {
      throw new Error("비밀번호는 8자 이상이어야 합니다.");
    }

    // 비밀번호 해시 처리
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 해시된 비밀번호로 회원가입 처리
    const row = await authModel.signup(email, hashedPassword, name, phone);
    return row;
  } catch (error) {
    console.error("Error in authService.signup:", error);
    throw error;
  }
};

/**
 * 사용자 로그인 서비스
 * @param {string} email - 사용자 이메일
 * @param {string} password - 비밀번호
 * @returns {Promise<Object>} 사용자 정보와 JWT 토큰
 * @throws {Error} 로그인 과정에서 발생한 에러
 */
export const login = async (email, password) => {
  try {
    // 1. 이메일로 사용자 조회
    const user = await authModel.findByEmail(email);

    if (!user) {
      throw new Error("존재하지 않는 이메일입니다.");
    }

    // 2. 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("isPasswordValid", isPasswordValid);
    console.log("user.password", user.password);
    console.log("password", password);
    if (!isPasswordValid) {
      throw new Error("비밀번호가 일치하지 않습니다.");
    }

    // 토큰 생성
    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);

    // 4. 비밀번호 제외한 사용자 정보 반환
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token: accessToken,
      refreshToken: refreshToken,
    };
  } catch (error) {
    console.error("Error in authService.login:", error);
    throw error;
  }
};

/**
 * 리프레시 토큰을 검증하고 새로운 액세스 토큰을 발급
 * @param {string} refreshToken - 리프레시 토큰
 * @returns {Promise<Object>} 새로운 액세스 토큰과 리프레시 토큰
 * @throws {Error} 토큰 갱신 과정에서 발생한 에러
 */
export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("리프레시 토큰이 필요합니다.");
  }

  // 리프레시 토큰 검증 (true를 전달하여 리프레시 토큰임을 명시)
  const { success, decoded, message } = verifyToken(refreshToken, true);

  if (!success) {
    throw new Error(`토큰 검증 실패: ${message}`);
  }

  // 리프레시 토큰에서 사용자 정보 추출
  const { id, email, name } = decoded;

  // 사용자 존재 여부 확인 (선택사항, 필요에 따라 구현)
  // const user = await authModel.findById(id);
  // if (!user) {
  //   throw new Error('사용자를 찾을 수 없습니다.');
  // }

  // 새로운 액세스 토큰 발급
  const newAccessToken = generateAccessToken({ id, email, name });

  // 리프레시 토큰도 갱신 (선택사항)
  const newRefreshToken = generateRefreshToken({ id, email, name });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: { id, email, name },
  };
};

export default { signup, login, refreshAccessToken };
