// routes/reservation.router.js
const express = require("express");
const {
  getSlotsByPharmacy,
  getAvailableDates,
  createReservation,
  getBook,
} = require("./reservation.controller");

const router = express.Router();

router.get("/:p_id", getSlotsByPharmacy);
router.get("/:p_id/available-dates", getAvailableDates);
router.get("/:user_id/books", getBook);

router.post("/", createReservation);

module.exports = router;
