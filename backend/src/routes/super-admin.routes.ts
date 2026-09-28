import { Router } from "express";
import { superAdminController } from "../controllers/super-admin.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

// Strict security: Only verified super_admin role can access this router
router.use(requireAuth, requireRole("super_admin"));

router.get("/overview", (req, res, next) => superAdminController.getOverview(req, res, next));
router.get("/health", (req, res) => superAdminController.getSystemHealth(req, res));
router.get("/system-health", (req, res) => superAdminController.getSystemHealth(req, res));
router.get("/admins", (req, res, next) => superAdminController.getAdmins(req, res, next));
router.post("/admins", (req, res, next) => superAdminController.createAdmin(req, res, next));
router.patch("/admins/:uid/status", (req, res, next) => superAdminController.updateAdminStatus(req, res, next));

export const superAdminRoutes = router;
export default superAdminRoutes;
