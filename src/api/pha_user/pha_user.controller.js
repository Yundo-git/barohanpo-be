import { fetchAll, fetchById } from "./pha_user.service.js";

export const getAllpha_user = async (req, res) => {
  try {
    const rows = await fetchAll();
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error("Error in pha_userController.getAllpha_user:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getpha_userById = async (req, res) => {
  const { p_id } = req.params;
  try {
    const row = await fetchById(p_id);
    res.json({ success: true, data: row });
  } catch (error) {
    console.error("Error in pha_userController.getpha_userById:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
