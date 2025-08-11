const pharmacyService = require("./pharmacy.service");
const debug = require("debug");

// Namespace for this controller's logs
const log = debug("app:pharmacy");

/**
 * @swagger
 * components:
 *   schemas:
 *     Pharmacy:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "우리동네약국"
 *         address:
 *           type: string
 *           example: "서울시 강남구 역삼동 123-45"
 *         phone:
 *           type: string
 *           example: "02-123-4567"
 *         lat:
 *           type: number
 *           format: float
 *           example: 37.5665
 *         lng:
 *           type: number
 *           format: float
 *           example: 126.9780
 *         distance:
 *           type: number
 *           format: float
 *           description: "사용자 위치로부터의 거리(km)"
 *           example: 1.2
 *         businessHours:
 *           type: string
 *           example: "09:00~21:00"
 *         isOpen:
 *           type: boolean
 *           description: "현재 영업 중 여부"
 *           example: true
 */

/**
 * @swagger
 * tags:
 *   name: Pharmacy
 *   description: 약국 관련 API
 */

/**
 * @swagger
 * /api/pharmacies:
 *   get:
 *     summary: 전체 약국 목록 조회
 *     description: 등록된 모든 약국의 목록을 조회합니다.
 *     tags: [Pharmacies]
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: 조회된 약국 수
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pharmacy'
 *       500:
 *         description: 서버 오류
 */
const getAllpharmacy = async (req, res, next) => {
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
 * @swagger
 * /api/pharmacies/nearby:
 *   get:
 *     summary: 근처 약국 조회
 *     description: 사용자의 현재 위치 기반으로 근처 약국을 조회합니다.
 *     tags: [Pharmacies]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *           format: float
 *         required: true
 *         description: 사용자 위도
 *         example: 37.5665
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *           format: float
 *         required: true
 *         description: 사용자 경도
 *         example: 126.9780
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: 조회된 약국 수
 *                   example: 4
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pharmacy'
 *       400:
 *         description: 잘못된 요청 파라미터
 *       500:
 *         description: 서버 오류
 */

const getNearbypharmacy = async (req, res, next) => {
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

const getpharmacyById = async (req, res, next) => {
  const { p_id } = req.params;
  log("p_id", p_id);
  try {
    const pharmacy = await pharmacyService.fetchById(p_id);
    res.status(200).json({
      success: true,
      data: pharmacy,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllpharmacy,
  getNearbypharmacy,
  getpharmacyById
};
