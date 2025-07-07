import * as pharmacyService from "./pharmacy.service.js";
import { idParamSchema } from "./pharmacy.validation.js";

/**
 * GET /api/pharmacies
 * 약국 목록 전체 조회
 */
export const getAllpharmacy = async (req, res, next) => {
  try {
    const pharmacies = await pharmacyService.fetchAll();
    res.status(200).json({
      success: true,
      count: pharmacies.length,
      data: pharmacies,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/pharmacies/:id
 * 단일 약국 조회
 */
export const getpharmacyById = async (req, res, next) => {
  try {
    // 파라미터 검증
const { value, error } = idParamSchema.validate(req.params);
if (error) {
  return res.status(400).json({ success: false, message: error.message });
}
const { id } = value;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    const pharmacy = await pharmacyService.fetchById(id);

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found",
      });
    }

    res.status(200).json({
      success: true,
      data: pharmacy,
    });
  } catch (error) {
    next(error);
  }
};
