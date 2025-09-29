// routes/reservation.router.js
import { Router } from "express";
import {
  getSlotsByPharmacy,
  getAvailableDates,
  createReservation,
  getBook,
  cancelBook,
  getcancelList,
  sendEmailController,
} from "./reservation.controller.js";

const router = Router();

router.get("/:p_id", getSlotsByPharmacy);
router.get("/:p_id/available-dates", getAvailableDates);
router.get("/:user_id/books", getBook);
router.post("/:user_id/books/cancel", cancelBook);
router.get("/:user_id/books/cancel/list", getcancelList);
router.post("/", createReservation);
router.post("/send-email", sendEmailController);

export default router;
