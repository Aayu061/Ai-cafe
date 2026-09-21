import { Router } from "express";
import { recommendDrink } from "../controllers/barista.controller";
import { baristaRateLimiter } from "../middleware/rate-limit.middleware";

const router = Router();

// AI Barista recommendation endpoint protected by rate limiter (10 req/min per IP)
router.post("/recommend", baristaRateLimiter, recommendDrink);

export const baristaRoutes = router;
export default baristaRoutes;
