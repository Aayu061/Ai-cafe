import {
  AiProvider,
  BaristaExtractionResult,
  BaristaMessage,
  BaristaPreferences,
  SafeCatalogContext,
} from "./ai-provider.types";
import { ProductDoc, DrinkConfiguration, DrinkDna } from "../../types/catalog";
import { BARISTA_SYSTEM_INSTRUCTIONS } from "../barista/barista.system-prompt";
import { MockAiProvider } from "./mock.provider";

export class GeminiApiError extends Error {
  readonly code = "GEMINI_API_ERROR";
  readonly statusCode = 502;

  constructor(message: string) {
    super(message);
    this.name = "GeminiApiError";
  }
}

export class GeminiAiProvider implements AiProvider {
  readonly name = "gemini";
  private apiKey: string;
  private model: string;
  private discoveredModel?: string;

  constructor(apiKey: string, model: string = "gemini-2.5-flash") {
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Dynamically inspects Google API to find models that support generateContent for this key.
   */
  private async getAvailableModels(): Promise<string[]> {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`
      );
      if (res.ok) {
        const data = (await res.json()) as {
          models?: Array<{ name: string; supportedGenerationMethods?: string[] }>;
        };
        return (data.models || [])
          .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
          .map((m) => m.name.replace(/^models\//, ""));
      }
    } catch {
      // Ignore discovery error
    }
    return [];
  }

  private async executeGenerateContent(
    model: string,
    promptPayload: unknown
  ): Promise<Response> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promptPayload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  async extractPreferences(
    message: string,
    history: BaristaMessage[],
    catalogContext: SafeCatalogContext
  ): Promise<BaristaExtractionResult> {
    const promptPayload = {
      systemInstruction: {
        parts: [
          {
            text: `${BARISTA_SYSTEM_INSTRUCTIONS}\n\nAvailable Products:\n${JSON.stringify(
              catalogContext.products.map((p) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                temp: p.temperatureProfile,
                sweetness: p.sweetnessProfile,
                strength: p.strengthProfile,
                notes: p.tasteNotes,
              })),
              null,
              2
            )}\n\nValid Ingredient IDs:\nBases: ${catalogContext.availableBases.join(
              ", "
            )}\nMilks: ${catalogContext.availableMilks.join(
              ", "
            )}\nFlavors: ${catalogContext.availableFlavors.join(
              ", "
            )}\nSweetness: ${catalogContext.availableSweetness.join(
              ", "
            )}\nIce: ${catalogContext.availableIce.join(
              ", "
            )}\nSizes: ${catalogContext.availableSizes.join(
              ", "
            )}\nToppings: ${catalogContext.availableToppings.join(", ")}`,
          },
        ],
      },
      contents: [
        ...history.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        {
          role: "user",
          parts: [
            {
              text: `Analyze this drink request and return a JSON object with:
1. "preferences": { "temperature", "sweetness" (0-100), "strength" (0-100), "creaminess" (0-100), "chill" (0-100), "richness" (0-100), "flavorPreferences": [], "flavorAvoidances": [], "milkPreference", "basePreference", "categoryPreference" }
2. "intentSummary": concise 1-sentence customer intent
3. "suggestedProductId": (optional, must be one of the provided product IDs)
4. "suggestedCustomizations": (optional, must use strictly valid ingredient IDs)

Customer Message: "${message}"`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    };

    const candidateModels = Array.from(
      new Set(
        [
          this.discoveredModel,
          this.model,
          "gemini-2.5-flash",
          "gemini-2.0-flash",
          "gemini-1.5-flash-latest",
          "gemini-1.5-flash-002",
          "gemini-1.5-flash",
        ].filter(Boolean) as string[]
      )
    );

    try {
      let lastErrorMessage = "";

      for (const candidate of candidateModels) {
        try {
          const res = await this.executeGenerateContent(candidate, promptPayload);
          if (res.ok) {
            this.discoveredModel = candidate;
            const data = (await res.json()) as {
              candidates?: Array<{
                content?: {
                  parts?: Array<{ text?: string }>;
                };
              }>;
            };

            const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawJson) {
              const parsed = JSON.parse(rawJson) as BaristaExtractionResult;
              return {
                preferences: parsed.preferences || {},
                intentSummary: parsed.intentSummary || "Customer requested a tailored beverage.",
                suggestedProductId: parsed.suggestedProductId,
                suggestedCustomizations: parsed.suggestedCustomizations,
              };
            }
          } else {
            const errorText = await res.text();
            lastErrorMessage = `(${res.status}) ${errorText}`;
            if (res.status === 404) {
              // Try next candidate model
              continue;
            }
          }
        } catch (candidateErr: unknown) {
          lastErrorMessage = (candidateErr as Error).message;
        }
      }

      // If all candidates failed with 404, dynamically list all models supporting generateContent
      const available = await this.getAvailableModels();
      if (available.length > 0) {
        const autoModel =
          available.find((m) => m.includes("2.5-flash")) ||
          available.find((m) => m.includes("flash")) ||
          available.find((m) => m.includes("pro")) ||
          available[0];

        if (autoModel && !candidateModels.includes(autoModel)) {
          try {
            const res = await this.executeGenerateContent(autoModel, promptPayload);
            if (res.ok) {
              this.discoveredModel = autoModel;
              const data = (await res.json()) as {
                candidates?: Array<{
                  content?: {
                    parts?: Array<{ text?: string }>;
                  };
                }>;
              };
              const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (rawJson) {
                const parsed = JSON.parse(rawJson) as BaristaExtractionResult;
                return {
                  preferences: parsed.preferences || {},
                  intentSummary: parsed.intentSummary || "Customer requested a tailored beverage.",
                  suggestedProductId: parsed.suggestedProductId,
                  suggestedCustomizations: parsed.suggestedCustomizations,
                };
              }
            }
          } catch {}
        }
      }

      console.warn(
        `[GeminiAiProvider] Live Gemini extraction was unsuccessful: ${lastErrorMessage}. Falling back gracefully to grounded mock provider.`
      );
      return new MockAiProvider().extractPreferences(message, history, catalogContext);
    } catch (err: unknown) {
      console.warn(
        `[GeminiAiProvider] Extraction error (${(err as Error).message}). Falling back to mock provider.`
      );
      return new MockAiProvider().extractPreferences(message, history, catalogContext);
    }
  }

  async generateExplanation(
    product: ProductDoc,
    preferences: BaristaPreferences,
    config: DrinkConfiguration,
    dna: DrinkDna
  ): Promise<string> {
    const reasons: string[] = [];

    if (preferences.temperature) {
      reasons.push(
        product.temperatureProfile.toLowerCase() === preferences.temperature
          ? `Its ${product.temperatureProfile.toLowerCase()} profile matches your temperature preference.`
          : `Served chilled for maximum refreshment.`
      );
    }

    if (config.milkId && config.milkId !== "whole-milk") {
      reasons.push(`Customized with ${config.milkId.replace("-", " ")}.`);
    }

    if (config.flavorId && config.flavorId !== "flavor-none") {
      reasons.push(`Infused with ${config.flavorId} to elevate flavor.`);
    }

    if (dna.strength >= 70) {
      reasons.push("Delivers a robust, bold coffee kick.");
    }

    return reasons.length > 0
      ? reasons.join(" ")
      : `${product.name} is one of our specialty highlights, balancing ${product.tasteNotes.join(", ")}.`;
  }
}
