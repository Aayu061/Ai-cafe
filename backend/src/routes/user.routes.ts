import { Router } from "express";
import { getMe, getMyProfile, updateMyProfile } from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { authRateLimiter } from "../middleware/rate-limit.middleware";

import {
  getFavorites,
  addFavorite,
  removeFavorite,
  getSavedDrinks,
  saveDrink,
  deleteSavedDrink,
} from "../controllers/customer-commerce.controller";

const router = Router();

// GET /api/me — Verified Firebase identity with role & status
router.get("/me", authRateLimiter, requireAuth, getMe);

// GET /api/users/me — Verified user Firestore profile
router.get("/users/me", authRateLimiter, requireAuth, getMyProfile);

// PATCH /api/users/me — Update user profile (role-protected: cannot self-promote)
router.patch("/users/me", authRateLimiter, requireAuth, updateMyProfile);
router.patch("/me", authRateLimiter, requireAuth, updateMyProfile);

// Customer Favorites Endpoints
router.get("/favorites", authRateLimiter, requireAuth, getFavorites);
router.post("/favorites/:productId", authRateLimiter, requireAuth, addFavorite);
router.delete("/favorites/:productId", authRateLimiter, requireAuth, removeFavorite);

// Customer Saved Custom Drinks Endpoints
router.get("/saved-drinks", authRateLimiter, requireAuth, getSavedDrinks);
router.post("/saved-drinks", authRateLimiter, requireAuth, saveDrink);
router.delete("/saved-drinks/:id", authRateLimiter, requireAuth, deleteSavedDrink);

export const userRoutes = router;
export default userRoutes;
