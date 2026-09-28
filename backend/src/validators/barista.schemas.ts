import { z } from "zod";

export const baristaConversationMessageSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(500, "Turn content cannot exceed 500 characters").trim().optional(),
    text: z.string().max(500, "Turn text cannot exceed 500 characters").trim().optional(),
  })
  .transform((val) => ({
    role: val.role,
    content: val.content || val.text || "",
  }));

export const baristaPreferencesInputSchema = z
  .object({
    temperature: z.enum(["hot", "cold", "blended"]).optional(),
    sweetness: z.number().min(0).max(100).optional(),
    strength: z.number().min(0).max(100).optional(),
    creaminess: z.number().min(0).max(100).optional(),
    chill: z.number().min(0).max(100).optional(),
    richness: z.number().min(0).max(100).optional(),
    flavor: z.string().max(100).optional(),
    flavorPreferences: z.array(z.string().max(100)).optional(),
    flavorAvoidances: z.array(z.string().max(100)).optional(),
    milk: z.string().max(100).optional(),
    milkPreference: z.string().max(100).optional(),
    basePreference: z.string().max(100).optional(),
    category: z.string().max(100).optional(),
    categoryPreference: z.string().max(100).optional(),
    budget: z.number().min(0).max(10000).optional(),
  })
  .optional();

export const recommendationRequestSchema = z.object({
  message: z
    .string()
    .min(1, "Please provide a description of the drink or mood you desire.")
    .max(500, "Message cannot exceed 500 characters.")
    .trim(),
  conversation: z
    .array(baristaConversationMessageSchema)
    .max(8, "Conversation history cannot exceed 8 messages.")
    .optional()
    .default([]),
  preferences: baristaPreferencesInputSchema,
  recentProductIds: z.array(z.string().max(100)).max(10).optional().default([]),
  activeProductId: z.string().max(100).optional(),
});

export type BaristaConversationMessage = z.infer<typeof baristaConversationMessageSchema>;
export type RecommendationRequestInput = z.infer<typeof recommendationRequestSchema>;
