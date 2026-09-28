import { Router } from "express";
import { recommendDrink } from "../controllers/barista.controller";
import { baristaRateLimiter } from "../middleware/rate-limit.middleware";
import { optionalAuth } from "../middleware/auth.middleware";

const router = Router();

// AI Barista recommendation endpoint protected by rate limiter (10 req/min per IP) and optional auth for returning customer personalization
router.post("/recommend", baristaRateLimiter, optionalAuth, recommendDrink);

export const baristaRoutes = router;
export default baristaRoutes;
