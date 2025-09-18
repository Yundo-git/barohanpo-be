import express from "express";
import {
  toggleFavoriteController,
  getFavoritesController,
} from "./favorites.controller.js";

const router = express.Router();

// POST /api/favorites
router.post("/", toggleFavoriteController);
router.get("/", getFavoritesController);

export default router;
