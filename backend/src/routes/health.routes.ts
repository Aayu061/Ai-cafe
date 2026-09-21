import { Router } from "express";
import { getHealth } from "../controllers/health.controller";

const router = Router();

// GET /health
router.get("/", getHealth);

export const healthRoutes = router;
export default healthRoutes;
