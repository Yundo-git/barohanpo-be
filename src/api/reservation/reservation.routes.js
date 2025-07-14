// routes/reservation.router.js
import express from "express";
import { getSlotsByPharmacy, getAvailableDates, createReservation } from "./reservation.controller.js";

const router = express.Router();

router.get("/:p_id", getSlotsByPharmacy);
router.get("/:p_id/available-dates", getAvailableDates);

router.post("/", createReservation);

export default router;
