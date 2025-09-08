// utils/nicknameGenerator.js
const adjectives = [
  "건강한",
  "튼튼한",
  "상쾌한",
  "깨끗한",
  "밝은",
  "신속한",
  "정확한",
  "따뜻한",
  "편안한",
  "생기있는",
  "맑은",
  "따사로운",
  "포근한",
  "기운찬",
  "산뜻한",
  "상큼한",
  "싱그러운",
];

const nouns = [
  "비타민",
  "영양제",
  "의사",
  "간호사",
  "병원",
  "약국",
  "보건소",
  "건강",
  "치료",
  "진료",
  "수면",
  "면역",
  "소화",
  "심장",
  "뇌",
  "간",
  "신장",
  "폐",
  "위",
  "장",
  "혈압",
  "혈당",
  "콜레스테롤",
  "체온",
  "맥박",
  "수술",
  "주사",
  "처방",
  "검사",
  "진단",
  "의료진",
  "간병인",
  "환자",
  "보호자",
  "치료사",
];

/**
 * 랜덤 닉네임 생성
 */
function generateRandomNickname() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(100 + Math.random() * 900); // 100~999
  return `${adj}${noun}${num}`;
}

module.exports = { generateRandomNickname };
