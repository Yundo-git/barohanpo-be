// routes/reservation.router.js
import express from "express";
import { getSlotsByPharmacy } from "./reservation.controller.js";

const router = express.Router();

router.get("/:p_id", getSlotsByPharmacy);

export default router;
