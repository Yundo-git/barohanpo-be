import express from "express";
import { getAllpharmacy, getpharmacyById } from "./pharmacy.controller.js";
const router = express.Router();

router.get("/", getAllpharmacy);
router.get("/:id", getpharmacyById);

export default router;
