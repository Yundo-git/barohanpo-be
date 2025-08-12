// controllers/reservation.controller.js
const debug = require("debug");
const { fetchSlotsInRange, fetchAvailableDates, reservationService } = require("./reservation.service");

const log = debug("app:reservation");

const getSlotsByPharmacy = async (req, res) => {
  const { p_id } = req.params;
  const { from, to } = req.query;

  console.log(`[API] getSlotsByPharmacy - p_id: ${p_id}, from: ${from}, to: ${to}`);

  if (!from || !to) {
    console.error('[ERROR] Missing required parameters - from or to is missing');
    return res.status(400).json({ 
      success: false, 
      error: "from, to 값이 필요합니다.",
      received: { p_id, from, to }
    });
  }

  try {
    console.log(`[API] Fetching slots for pharmacy ${p_id} from ${from} to ${to}`);
    const data = await fetchSlotsInRange(p_id, from, to);
    console.log(`[API] Found ${data.length} days of slot data`);
    res.json(data);
  } catch (error) {
    console.error('[ERROR] getSlotsByPharmacy failed:', {
      error: error.message,
      stack: error.stack,
      params: { p_id, from, to }
    });
    res.status(500).json({ 
      success: false, 
      error: '서버 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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