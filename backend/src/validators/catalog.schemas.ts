import { z } from "zod";

export const validateDrinkSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  baseId: z.string().min(1, "Base selection is required"),
  milkId: z.string().min(1, "Milk selection is required"),
  flavorId: z.string().min(1, "Flavor selection is required"),
  sweetnessId: z.string().min(1, "Sweetness selection is required"),
  iceId: z.string().min(1, "Ice selection is required"),
  toppingIds: z.array(z.string()).default([]),
  sizeId: z.string().min(1, "Size selection is required"),
});

export const productsQuerySchema = z.object({
  category: z.string().optional(),
  featured: z
    .string()
    .optional()
    .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
});

export const ingredientsQuerySchema = z.object({
  type: z
    .enum(["base", "milk", "flavor", "sweetness", "ice", "topping", "size"])
    .optional(),
});

export type ValidateDrinkInput = z.infer<typeof validateDrinkSchema>;
