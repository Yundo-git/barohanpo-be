import Joi from "joi";

/**
 * 약국 생성/수정시 사용하는 공통 필드 스키마
 */
const baseSchema = {
  name: Joi.string().min(2).max(50).required().messages({
    "string.base": "name은 문자열이어야 합니다.",
    "string.empty": "name을 입력해주세요.",
    "string.min": "name은 최소 {#limit}자 이상이어야 합니다.",
    "any.required": "name은 필수 값입니다.",
  }),
  address: Joi.string().min(5).max(255).required().messages({
    "string.empty": "address를 입력해주세요.",
    "any.required": "address는 필수 값입니다.",
  }),
  phone: Joi.string()
    .pattern(/^[0-9-]{9,14}$/)
    .required()
    .messages({
      "string.pattern.base": "phone 형식이 올바르지 않습니다.",
      "any.required": "phone은 필수 값입니다.",
    }),
};

/**
 * POST /api/pharmacy  body 검증
 */
const createPharmacySchema = Joi.object({
  ...baseSchema,
});

/**
 * PUT /api/pharmacy/:id body 검증 (모든 필드 optional)
 */
const updatePharmacySchema = Joi.object({
  name: baseSchema.name.optional(),
  address: baseSchema.address.optional(),
  phone: baseSchema.phone.optional(),
});

/**
 * ID 파라미터 검증 스키마
 */
const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "id는 숫자여야 합니다.",
    "any.required": "id 파라미터가 필요합니다.",
  }),
});

export {
  createPharmacySchema,
  updatePharmacySchema,
  idParamSchema
};
