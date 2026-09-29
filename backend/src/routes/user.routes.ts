import { Router } from "express";
import { getMe, getMyProfile, updateMyProfile } from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { authRateLimiter } from "../middleware/rate-limit.middleware";

const router = Router();

// GET /api/me — Verified Firebase identity with role & status
router.get("/me", authRateLimiter, requireAuth, getMe);

// GET /api/users/me — Verified user Firestore profile
router.get("/users/me", authRateLimiter, requireAuth, getMyProfile);

// PATCH /api/users/me — Update user profile (role-protected: cannot self-promote)
router.patch("/users/me", authRateLimiter, requireAuth, updateMyProfile);
router.patch("/me", authRateLimiter, requireAuth, updateMyProfile);

export const userRoutes = router;
export default userRoutes;
