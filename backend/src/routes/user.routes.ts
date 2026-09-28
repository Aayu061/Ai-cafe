import { Router } from "express";
import { getMe, getMyProfile, updateMyProfile } from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// GET /api/me — Verified Firebase identity with role & status
router.get("/me", requireAuth, getMe);

// GET /api/users/me — Verified user Firestore profile
router.get("/users/me", requireAuth, getMyProfile);

// PATCH /api/users/me — Update user profile (role-protected: cannot self-promote)
router.patch("/users/me", requireAuth, updateMyProfile);
router.patch("/me", requireAuth, updateMyProfile);

export const userRoutes = router;
export default userRoutes;
