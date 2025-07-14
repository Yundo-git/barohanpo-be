// controllers/reservation.controller.js
import debug from "debug";
import { fetchSlotsInRange, fetchAvailableDates, reservationService } from "./reservation.service.js";

const log = debug("app:reservation");

export const getSlotsByPharmacy = async (req, res) => {
  const { p_id } = req.params;
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ success: false, error: "from, to 값 필요" });
  }

  try {
    const data = await fetchSlotsInRange(p_id, from, to);
    res.json(data); // 프론트에서는 data 배열만 받도록
    log("slots", data);
  } catch (error) {
    log("Error in getSlotsByPharmacy:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAvailableDates = async (req, res) => {
  const { p_id } = req.params;
  try {
    const data = await fetchAvailableDates(p_id);
    res.json(data); // 프론트에서는 data 배열만 받도록
    log("slots", data);
  } catch (error) {
    log("Error in getSlotsByPharmacy:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createReservation = async (req, res) => {
  const { user_id, pharmacy_id, date, time, memo } = req.body;

  try {
    const result = await reservationService.createReservation({
      user_id,
      pharmacy_id,
      date,
      time,
      memo,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error in reservationController.createReservation:", error);
    res.status(500).json({ success: false, error: error.message });
  }

};