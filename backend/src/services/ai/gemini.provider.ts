import {
  AiProvider,
  BaristaExtractionResult,
  BaristaMessage,
  BaristaPreferences,
  SafeCatalogContext,
} from "./ai-provider.types";
import { ProductDoc, DrinkConfiguration, DrinkDna } from "../../types/catalog";
import { BARISTA_SYSTEM_INSTRUCTIONS } from "../barista/barista.system-prompt";

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

  constructor(apiKey: string, model: string = "gemini-1.5-flash") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async extractPreferences(
    message: string,
    history: BaristaMessage[],
    catalogContext: SafeCatalogContext
  ): Promise<BaristaExtractionResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

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

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = errorText;
        try {
          const parsedErr = JSON.parse(errorText);
          errorMessage = parsedErr.error?.message || errorText;
        } catch {}
        throw new GeminiApiError(`Gemini error (${res.status}): ${errorMessage}`);
      }

      const data = (await res.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };

      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) {
        throw new Error("Gemini returned empty or malformed content structure.");
      }

      const parsed = JSON.parse(rawJson) as BaristaExtractionResult;
      return {
        preferences: parsed.preferences || {},
        intentSummary: parsed.intentSummary || "Customer requested a tailored beverage.",
        suggestedProductId: parsed.suggestedProductId,
        suggestedCustomizations: parsed.suggestedCustomizations,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if ((err as Error).name === "AbortError") {
        throw new Error("AI provider request timed out after 12 seconds.");
      }
      throw err;
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
