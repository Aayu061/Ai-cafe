import { Router } from "express";
import { staffController } from "../controllers/staff.controller";
import { requireAuth, authorize } from "../middleware/auth.middleware";

const router = Router();

// Staff route security: Requires verified session and staff/admin/super_admin role
router.use(requireAuth, authorize("staff", "admin", "super_admin"));

// Operational Orders
router.get("/orders", (req, res, next) => staffController.getOrders(req, res, next));
router.patch("/orders/:id", (req, res, next) => staffController.updateOrderStatus(req, res, next));

// Operational Inventory & Low Stock Alerts
router.get("/inventory", (req, res, next) => staffController.getOperationalInventory(req, res, next));

// Staff Profile
router.get("/profile", (req, res) => staffController.getStaffProfile(req, res));

export const staffRoutes = router;
export default staffRoutes;
