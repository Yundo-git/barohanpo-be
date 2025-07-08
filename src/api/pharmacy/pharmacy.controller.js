import * as pharmacyService from "./pharmacy.service.js";
import debug from "debug";

// Namespace for this controller's logs
const log = debug("app:pharmacy");

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
 * GET /api/pharmacies/nearby
 * 근처 약국 조회
 */

export const getNearbypharmacy = async (req, res, next) => {
  const { lat, lng } = req.query;
  log("req.query", req.query);
  log("latitude=%s longitude=%s", lat, lng);
  try {
    const pharmacies = await pharmacyService.fetchNearby(lat, lng, 4);
    res.status(200).json({
      success: true,
      count: pharmacies.length,
      data: pharmacies,
    });
  } catch (error) {
    next(error);
  }
};
