import { Request, Response, NextFunction } from "express";
import { orderService } from "../services/operations/order.service";
import { inventoryService } from "../services/operations/inventory.service";
import { OrderStatus } from "../types/operations";

export class StaffController {
  /**
   * GET /api/staff/orders — Retrieves active operational orders for café kitchen/barista
   */
  async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as OrderStatus | undefined;
      const orders = await orderService.getOrders(status);

      res.status(200).json({
        success: true,
        orders,
        count: orders.length,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/staff/orders/:id — Updates order fulfillment state (e.g. preparing, ready, completed)
   */
  async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = req.params.id as string;
      const { status } = req.body as { status: OrderStatus };

      if (!status || !["new", "preparing", "ready", "completed", "cancelled"].includes(status)) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "A valid status ('new', 'preparing', 'ready', 'completed', 'cancelled') is required.",
          },
        });
        return;
      }

      const actor = req.user!;
      const updated = await orderService.updateOrderStatus(orderId, status, actor.uid, actor.role);

      res.status(200).json({
        success: true,
        order: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/staff/inventory — Operational inventory view with low-stock warnings
   */
  async getOperationalInventory(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [inventory, lowStock] = await Promise.all([
        inventoryService.getInventory(),
        inventoryService.getLowStockItems(),
      ]);

      res.status(200).json({
        success: true,
        inventory,
        lowStockAlerts: lowStock,
        totalItems: inventory.length,
        lowStockCount: lowStock.length,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/staff/profile — Staff member operational profile
   */
  async getStaffProfile(req: Request, res: Response): Promise<void> {
    const user = req.user!;
    res.status(200).json({
      success: true,
      staff: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        permissions: user.permissions,
      },
    });
  }
}

export const staffController = new StaffController();
