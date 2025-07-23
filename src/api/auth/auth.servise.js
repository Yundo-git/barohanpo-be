import { authModel } from "./auth.Model.js";

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

    const row = await authModel.signup(email, password, name, phone);
    return row;
  } catch (error) {
    console.error("Error in authService.signup:", error);
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    const user = await authModel.login(email, password);
    return user;
  } catch (error) {
    console.error("Error in authService.login:", error);
    throw error;
  }
};

// export default { signup, login };
