import { env } from "../../config/env";
import { AiProvider } from "./ai-provider.types";
import { GeminiAiProvider } from "./gemini.provider";
import { MockAiProvider } from "./mock.provider";

export class AiBaristaNotConfiguredError extends Error {
  readonly code = "AI_BARISTA_NOT_CONFIGURED";
  readonly statusCode = 503;

  constructor(
    message: string = "AI Barista provider is not configured. Set AI_API_KEY in the server environment."
  ) {
    super(message);
    this.name = "AiBaristaNotConfiguredError";
  }
}

export function getAiProvider(): AiProvider {
  const providerType = env.AI_PROVIDER;

  if (providerType === "mock") {
    return new MockAiProvider();
  }

  // Default: Gemini
  if (!env.AI_API_KEY) {
    throw new AiBaristaNotConfiguredError();
  }

  return new GeminiAiProvider(env.AI_API_KEY, env.AI_MODEL);
}
