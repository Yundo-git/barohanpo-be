import bcrypt from 'bcryptjs';
import { webcrypto } from 'crypto';

// 웹크립토를 사용 가능한 경우(브라우저) 사용하고, 그렇지 않으면 node:crypto 사용
const crypto = webcrypto || (await import('node:crypto')).webcrypto;

/**
 * 비밀번호를 해시화합니다.
 * @param {string} password - 평문 비밀번호
 * @returns {Promise<string>} 해시화된 비밀번호
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * 평문 비밀번호와 해시화된 비밀번호를 비교합니다.
 * @param {string} password - 평문 비밀번호
 * @param {string} hashedPassword - 해시화된 비밀번호
 * @returns {Promise<boolean>} 비밀번호가 일치하면 true
 */
const comparePasswords = async (password, hashedPassword) => {
  // 랜덤 바이트를 생성하고 비밀번호 문자로 변환
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * 랜덤 비밀번호를 생성합니다.
 * @param {number} length - 비밀번호 길이
 * @returns {string} 랜덤 비밀번호
 */
const generateRandomPassword = (length = 12) => {
  // 필요한 경우 누락된 문자 유형 추가
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]\\:;?><,./-=';
  let password = '';
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  
  for (let i = 0; i < length; i++) {
    password += charset[values[i] % charset.length];
  }
  
  return password;
};

export { hashPassword, comparePasswords, generateRandomPassword };
