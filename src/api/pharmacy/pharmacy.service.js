import { pharmacyModel } from "../../models/pharmacyModel.js";

/**
 * 서비스 계층 (Business Logic Layer)
 * Controller ↔ Service ↔ Model 구조에서
 * - Controller : HTTP 관련 처리 (req, res, next)
 * - Service    : 비즈니스 규칙, 트랜잭션, 모델 조합, 캐싱 등
 * - Model      : 순수 DB CRUD
 */

/**
 * 모든 약국을 조회
 * (필요하다면 여기서 캐싱, 필터, 페이지네이션 로직을 넣을 수 있음)
 */
export const fetchAll = async () => {
  // 단순히 모델을 호출하여 데이터를 가져온 뒤 그대로 반환
  const rows = await pharmacyModel.findAll();
  return rows;
};

/**
 * ID로 단일 약국 조회
 * @param {number|string} id - 약국 PK
 */
export const fetchById = async (id) => {
  // 여기서 추가 규칙(예: id 형식 검증, 로깅) 등을 수행 가능
  const row = await pharmacyModel.findById(id);
  return row;
};
