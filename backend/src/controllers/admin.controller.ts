import { Request, Response, NextFunction } from "express";
import { catalogService } from "../services/catalog.service";
import { inventoryService } from "../services/operations/inventory.service";
import { orderService } from "../services/operations/order.service";
import { userService } from "../services/user.service";
import { auditService } from "../services/operations/audit.service";
import { ProductDoc } from "../types/catalog";
import { UserRole, UserStatus } from "../types/roles";
import { InventoryMovementType, InventoryUnit } from "../types/operations";

export class AdminController {
  // ==========================================
  // 1. PRODUCTS MANAGEMENT
  // ==========================================

  async getProducts(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await catalogService.getProducts();
      res.status(200).json({
        success: true,
        products,
        count: products.length,
      });
    } catch (err) {
      next(err);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productData = req.body as ProductDoc;
      if (!productData.id || !productData.name || typeof productData.basePrice !== "number") {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Product id, name, and numeric basePrice are required.",
          },
        });
        return;
      }

      const actor = req.user!;
      const created = await catalogService.createProduct(productData, actor.uid, actor.role);

      res.status(201).json({
        success: true,
        product: created,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.params.id as string;
      const updates = req.body as Partial<ProductDoc>;

      const actor = req.user!;
      const updated = await catalogService.updateProduct(productId, updates, actor.uid, actor.role);

      res.status(200).json({
        success: true,
        product: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleProductAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.params.id as string;
      const { available } = req.body as { available: boolean };

      if (typeof available !== "boolean") {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "'available' boolean field is required.",
          },
        });
        return;
      }

      const actor = req.user!;
      const updated = await catalogService.setProductAvailability(
        productId,
        available,
        actor.uid,
        actor.role
      );

      res.status(200).json({
        success: true,
        product: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 2. INVENTORY MANAGEMENT
  // ==========================================

  async getInventory(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const inventory = await inventoryService.getInventory();
      res.status(200).json({
        success: true,
        inventory,
        total: inventory.length,
      });
    } catch (err) {
      next(err);
    }
  }

  async createInventoryItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, ingredientId, quantity, unit, reorderThreshold } = req.body as {
        name: string;
        ingredientId: string;
        quantity: number;
        unit: InventoryUnit;
        reorderThreshold: number;
      };

      if (!name || !ingredientId || typeof quantity !== "number" || !unit) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Name, ingredientId, numeric quantity, and unit are required.",
          },
        });
        return;
      }

      const actor = req.user!;
      const created = await inventoryService.createInventoryItem(
        { name, ingredientId, quantity, unit, reorderThreshold: reorderThreshold || 0 },
        actor.uid,
        actor.role
      );

      res.status(201).json({
        success: true,
        item: created,
      });
    } catch (err) {
      next(err);
    }
  }

  async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { inventoryId, quantityDelta, type, reason, referenceId } = req.body as {
        inventoryId: string;
        quantityDelta: number;
        type: InventoryMovementType;
        reason: string;
        referenceId?: string;
      };

      if (!inventoryId || typeof quantityDelta !== "number" || !type || !reason) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "inventoryId, numeric quantityDelta, type, and reason are required.",
          },
        });
        return;
      }

      const actor = req.user!;
      const result = await inventoryService.adjustStock(
        inventoryId,
        quantityDelta,
        type,
        reason,
        actor.uid,
        actor.role,
        referenceId
      );

      res.status(200).json({
        success: true,
        item: result.item,
        movement: result.movement,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const inventoryId = req.query.inventoryId as string | undefined;
      const movements = await inventoryService.getMovements(inventoryId);
      res.status(200).json({
        success: true,
        movements,
        count: movements.length,
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 3. ORDERS MANAGEMENT
  // ==========================================

  async getOrders(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await orderService.getOrders();
      res.status(200).json({
        success: true,
        orders,
        count: orders.length,
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 4. CUSTOMERS & STAFF
  // ==========================================

  async getCustomers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customers = await userService.listCustomers();
      res.status(200).json({
        success: true,
        customers,
        count: customers.length,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateCustomerStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerUid = req.params.id as string;
      const { status } = req.body as { status: UserStatus };

      if (!status || !["active", "suspended"].includes(status)) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Status must be either 'active' or 'suspended'.",
          },
        });
        return;
      }

      const actor = req.user!;
      const updated = await userService.updateUserProfile(
        customerUid,
        { status },
        true // Privileged update
      );

      await auditService.logAction({
        actorId: actor.uid,
        actorRole: actor.role,
        action: "CUSTOMER_STATUS_UPDATED",
        resourceType: "customer",
        resourceId: customerUid,
        metadata: { status },
      });

      res.status(200).json({
        success: true,
        customer: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStaff(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staffList = await userService.listStaff();
      res.status(200).json({
        success: true,
        staff: staffList,
        count: staffList.length,
      });
    } catch (err) {
      next(err);
    }
  }

  async assignStaffRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { targetUid, role } = req.body as { targetUid: string; role: UserRole };

      if (!targetUid || !role || !["customer", "staff", "admin", "super_admin"].includes(role)) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "targetUid and valid role ('customer', 'staff', 'admin', 'super_admin') are required.",
          },
        });
        return;
      }

      const actor = req.user!;
      const updated = await userService.assignRole(targetUid, role, actor.uid, actor.role);

      res.status(200).json({
        success: true,
        user: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // 5. ANALYTICS & AUDIT LOGS
  // ==========================================

  async getAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await orderService.getOrders();
      const inventory = await inventoryService.getInventory();
      const products = await catalogService.getProducts();

      // Real statistics only: Zero fabricated sales or artificial revenue
      const totalOrdersCount = orders.length;
      const totalInventoryItems = inventory.length;
      const lowStockCount = inventory.filter((i) => i.status === "low_stock" || i.status === "out_of_stock").length;
      const activeProductsCount = products.filter((p) => p.available).length;

      res.status(200).json({
        success: true,
        analytics: {
          totalOrders: totalOrdersCount,
          totalInventoryItems,
          lowStockCount,
          activeProductsCount,
          hasOrderHistory: totalOrdersCount > 0,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const logs = await auditService.getLogs(limit);
      res.status(200).json({
        success: true,
        logs,
        count: logs.length,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
