// services/reservation.service.js
import { booksModel } from "./reservation.Model.js";

export const fetchSlotsInRange = async (p_id, from, to) => {
  try {
    const rows = await booksModel.findSlotsByPharmacy(p_id, from, to);
    return rows;
  } catch (error) {
    console.error("Error in fetchSlotsInRange:", error);
    throw error;
  }
};
