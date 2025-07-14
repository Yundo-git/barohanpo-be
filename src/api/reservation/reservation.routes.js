// routes/reservation.router.js
import express from "express";
import { getSlotsByPharmacy } from "./reservation.controller.js";

const router = express.Router();

router.get("/:p_id", getSlotsByPharmacy);
router.get("/:p_id/available-dates", getAvailableDates);

export default router;
