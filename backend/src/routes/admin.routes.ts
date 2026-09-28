import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { requireAuth, authorize } from "../middleware/auth.middleware";

const router = Router();

// Admin route security: Requires verified session and admin/super_admin role
router.use(requireAuth, authorize("admin", "super_admin"));

// 1. Products Management
router.get("/products", (req, res, next) => adminController.getProducts(req, res, next));
router.post("/products", (req, res, next) => adminController.createProduct(req, res, next));
router.put("/products/:id", (req, res, next) => adminController.updateProduct(req, res, next));
router.patch("/products/:id/availability", (req, res, next) => adminController.toggleProductAvailability(req, res, next));

// 2. Inventory Management
router.get("/inventory", (req, res, next) => adminController.getInventory(req, res, next));
router.post("/inventory", (req, res, next) => adminController.createInventoryItem(req, res, next));
router.post("/inventory/adjust", (req, res, next) => adminController.adjustStock(req, res, next));
router.get("/inventory/movements", (req, res, next) => adminController.getMovements(req, res, next));

// 3. Orders Management
router.get("/orders", (req, res, next) => adminController.getOrders(req, res, next));

// 4. Customers & Staff
router.get("/customers", (req, res, next) => adminController.getCustomers(req, res, next));
router.patch("/customers/:id/status", (req, res, next) => adminController.updateCustomerStatus(req, res, next));

router.get("/staff", (req, res, next) => adminController.getStaff(req, res, next));
router.post("/staff", (req, res, next) => adminController.createStaff(req, res, next));
router.patch("/staff/:id/status", (req, res, next) => adminController.updateStaffStatus(req, res, next));
router.post("/staff/role", (req, res, next) => adminController.assignStaffRole(req, res, next));

// 5. Analytics & Audit
router.get("/analytics", (req, res, next) => adminController.getAnalytics(req, res, next));
router.get("/audit-logs", (req, res, next) => adminController.getAuditLogs(req, res, next));

export const adminRoutes = router;
export default adminRoutes;
