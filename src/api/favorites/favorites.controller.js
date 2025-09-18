import { favoritesModel } from "./favorites.model.js";
import { logger } from "../../utils/logger.js";

export const toggleFavoriteController = async (req, res) => {
  const { user_id, pharmacy_id } = req.body;

  if (!user_id || !pharmacy_id) {
    return res
      .status(400)
      .json({ success: false, message: "user_id와 pharmacy_id는 필수입니다." });
  }

  try {
    const isFavorite = await favoritesModel.getFavoriteStatus(
      user_id,
      pharmacy_id
    );

    if (isFavorite) {
      // 이미 찜한 상태 -> 찜 취소
      await favoritesModel.removeFavorite(user_id, pharmacy_id);
      logger.info(
        `찜 취소: User ${user_id} removed favorite for Pharmacy ${pharmacy_id}`
      );
      return res.json({ success: true, message: "찜 취소", action: "removed" });
    } else {
      // 찜하지 않은 상태 -> 찜 추가
      await favoritesModel.addFavorite(user_id, pharmacy_id);
      logger.info(
        `찜 추가: User ${user_id} added favorite for Pharmacy ${pharmacy_id}`
      );
      return res
        .status(201)
        .json({ success: true, message: "찜 추가", action: "added" });
    }
  } catch (error) {
    logger.error("Error in toggleFavoriteController:", error);
    res
      .status(500)
      .json({ success: false, error: "찜 상태 변경 중 오류가 발생했습니다." });
  }
};

export const getFavoritesController = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "userId는 필수입니다." });
  }

  try {
    const favorites = await favoritesModel.getFavoritesByUserId(Number(userId));
    res.json({ success: true, data: favorites });
  } catch (error) {
    logger.error("Error in getFavoritesController:", error);
    res
      .status(500)
      .json({ success: false, error: "찜 목록 조회 중 오류가 발생했습니다." });
  }
};
