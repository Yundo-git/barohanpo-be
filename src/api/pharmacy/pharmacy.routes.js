import express from "express";
import { getAllpharmacy, getNearbypharmacy } from "./pharmacy.controller.js";
const router = express.Router();

router.get("/", getAllpharmacy);
router.get("/nearby", getNearbypharmacy);

export default router;
