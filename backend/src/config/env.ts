import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env file if present
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),

  // Firebase Admin Credentials
  FIREBASE_PROJECT_ID: z.string().default("ai-cafe-2deb5"),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().optional(),

  // AI Provider Configuration (Server-Side Only)
  AI_PROVIDER: z.enum(["gemini", "mock"]).default("gemini"),
  AI_API_KEY: z
    .string()
    .optional()
    .transform((val) => (val ? val.trim().replace(/^["']|["']$/g, "") : undefined)),
  AI_MODEL: z.string().default("gemini-1.5-flash"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(parsed.error.format(), null, 2));
  throw new Error("Invalid environment configuration.");
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
