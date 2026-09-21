import { Router } from "express";
import { getMe, getMyProfile } from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// GET /api/me — Verified Firebase identity endpoint
router.get("/me", requireAuth, getMe);

// GET /api/users/me — Verified user Firestore profile endpoint
router.get("/users/me", requireAuth, getMyProfile);

export const userRoutes = router;
export default userRoutes;
