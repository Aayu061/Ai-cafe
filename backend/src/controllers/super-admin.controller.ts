import { Request, Response, NextFunction } from "express";
import { privilegedAccountService } from "../services/privileged-account.service";
import { catalogService } from "../services/catalog.service";
import { inventoryService } from "../services/operations/inventory.service";
import { orderService } from "../services/operations/order.service";
import { userService } from "../services/user.service";
import { auditService } from "../services/operations/audit.service";
import { UserStatus } from "../types/roles";

export class SuperAdminController {
  /**
   * GET /api/super-admin/admins — List all Administrator accounts
   */
  async getAdmins(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const admins = await privilegedAccountService.listAdminAccounts();
      res.status(200).json({
        success: true,
        admins,
        count: admins.length,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/super-admin/admins — Provision a new Administrator account
   */
  async createAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { uid, email, displayName, employeeId, permissions } = req.body as {
        uid?: string;
        email: string;
        displayName?: string;
        employeeId?: string;
        permissions?: string[];
      };

      if (!email) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Email is required to provision an Administrator account.",
          },
        });
        return;
      }

      const adminUid = uid || `adm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const adminName = displayName || email.split("@")[0] || "Café Admin";

      const actor = req.user!;
      const created = await privilegedAccountService.createAdminAccount(
        { uid: adminUid, email, displayName: adminName, employeeId, permissions },
        actor.uid,
        actor.role
      );

      res.status(201).json({
        success: true,
        admin: created,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/super-admin/admins/:uid/status — Suspend or reactivate an Administrator account
   */
  async updateAdminStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetUid = req.params.uid as string;
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
      const updated = await privilegedAccountService.updateAdminStatus(
        targetUid,
        status,
        actor.uid,
        actor.role
      );

      res.status(200).json({
        success: true,
        admin: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/super-admin/overview — Root system intelligence and ecosystem telemetries
   */
  async getOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [admins, staff, customers, products, inventory, orders, logs] = await Promise.all([
        privilegedAccountService.listAdminAccounts(),
        privilegedAccountService.listStaffAccounts(),
        userService.listCustomers(100),
        catalogService.getProducts(),
        inventoryService.getInventory(),
        orderService.getOrders(),
        auditService.getLogs(10),
      ]);

      res.status(200).json({
        success: true,
        domains: {
          superAdmins: 1,
          admins: admins.length,
          staff: staff.length,
          customers: customers.length,
        },
        overview: {
          totalAdmins: admins.length,
          totalStaff: staff.length,
          totalCustomers: customers.length,
          totalProducts: products.length,
          activeProducts: products.filter((p) => p.available).length,
          totalInventoryItems: inventory.length,
          lowStockAlerts: inventory.filter((i) => i.status === "low_stock" || i.status === "out_of_stock").length,
          totalOrders: orders.length,
          recentAuditLogs: logs,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/super-admin/system-health — Security posture and system defenses
   */
  async getSystemHealth(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      status: "operational",
      environment: process.env.NODE_ENV || "production",
      health: {
        serverTime: new Date().toISOString(),
        rbacTier: "4-tier separated domain (Customer, Staff, Admin, Super Admin)",
        selfPromotionDefense: "Active (Server-Authoritative Cleansing)",
        rateLimiter: "Active (60 req/min)",
        serverAuthoritativePricing: "Enforced (INR)",
        firestoreDomainCollections: [
          "users",
          "staffAccounts",
          "adminAccounts",
          "superAdminAccounts",
        ],
      },
    });
  }
}

export const superAdminController = new SuperAdminController();
