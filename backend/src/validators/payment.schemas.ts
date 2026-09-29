import { z } from "zod";
import { validateDrinkSchema } from "./catalog.schemas";

export const orderItemInputSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1).default(1),
  configuration: validateDrinkSchema.optional(),
  configurationSummary: z.string().max(200).optional(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemInputSchema).min(1, "At least one item is required in the order"),
  customerName: z.string().max(100).optional(),
  customerEmail: z.string().email("Invalid email address").optional(),
  customerPhone: z.string().max(20).optional(),
  fulfillmentType: z.enum(["dine-in", "takeaway", "curbside"]).default("takeaway"),
  notes: z.string().max(500).optional(),
});

export const createPaymentSessionSchema = z.object({
  returnUrl: z.string().min(1, "returnUrl is required"),
  notifyUrl: z.string().url("Invalid notifyUrl").optional(),
});

export const orderIdParamSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreatePaymentSessionInput = z.infer<typeof createPaymentSessionSchema>;
