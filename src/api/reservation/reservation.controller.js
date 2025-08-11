// controllers/reservation.controller.js
const debug = require("debug");
const { fetchSlotsInRange, fetchAvailableDates, reservationService } = require("./reservation.service");

const log = debug("app:reservation");

const getSlotsByPharmacy = async (req, res) => {
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

const getAvailableDates = async (req, res) => {
  const { p_id } = req.params;
  try {
    const data = await fetchAvailableDates(p_id);
    res.json(data); // 프론트에서는 data 배열만 받도록
    log("slots", data);
  } catch (error) {
    log("Error in getAvailableDates:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const createReservation = async (req, res) => {
  const { user_id, pharmacy_id, date, time, memo } = req.body;

  try {
    const result = await reservationService.createReservation(
      user_id,
      pharmacy_id,
      date,
      time,
      memo
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    log("Error in createReservation:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getSlotsByPharmacy,
  getAvailableDates,
  createReservation
};