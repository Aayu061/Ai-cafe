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

export const recommendationRequestSchema = z.object({
  message: z
    .string()
    .min(1, "Please provide a description of the drink or mood you desire.")
    .max(500, "Message cannot exceed 500 characters.")
    .trim(),
  conversation: z
    .array(baristaConversationMessageSchema)
    .max(6, "Conversation history cannot exceed 6 messages.")
    .optional()
    .default([]),
});

export type BaristaConversationMessage = z.infer<typeof baristaConversationMessageSchema>;
export type RecommendationRequestInput = z.infer<typeof recommendationRequestSchema>;
