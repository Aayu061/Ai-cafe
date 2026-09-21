import { z } from "zod";

/**
 * Common reusable validation schemas for future API extensions
 */

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const uidParamSchema = z.object({
  uid: z.string().min(1, "UID cannot be empty"),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;
export type UidParam = z.infer<typeof uidParamSchema>;
