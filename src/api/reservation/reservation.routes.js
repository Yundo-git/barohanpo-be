// routes/reservation.router.js
const express = require("express");
const {
  getSlotsByPharmacy,
  getAvailableDates,
  createReservation,
  getBook,
  cancelBook,
  getcancelList,
} = require("./reservation.controller");

const router = express.Router();

router.get("/:p_id", getSlotsByPharmacy);
router.get("/:p_id/available-dates", getAvailableDates);
router.get("/:user_id/books", getBook);
router.post("/:user_id/books/cancel", cancelBook);
router.get("/:user_id/books/cancel/list", getcancelList);
router.post("/", createReservation);

module.exports = router;
