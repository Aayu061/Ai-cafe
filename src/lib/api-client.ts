import { auth } from "@/lib/firebase/auth";
import { BaristaRecommendResponse } from "@/types/barista";

/**
 * Frontend API Client Helper
 * Configured for communication with the Express backend on Render / local development.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  user?: T;
  profile?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    retryAfterSeconds?: number;
  };
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Inject current Firebase ID Token if user is authenticated
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers["Authorization"] = `Bearer ${token}`;
    } catch (err) {
      console.warn("[API Client]: Failed to retrieve Firebase ID token:", err);
    }
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const targetUrl = `${BACKEND_URL}${cleanEndpoint}`;

  try {
    const res = await fetch(targetUrl, {
      ...options,
      headers,
    });

    const body = (await res.json()) as ApiResponse<T>;
    return body;
  } catch (err: unknown) {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: (err as Error).message || "Unable to reach backend service.",
      },
    };
  }
}

/**
 * AI Barista Recommendation API
 * Sends natural language drink request with conversation context to server.
 */
export async function recommendDrink(
  message: string,
  conversation: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<BaristaRecommendResponse> {
  const payload = {
    message,
    conversation: conversation.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };

  const response = await apiFetch<BaristaRecommendResponse>("/api/barista/recommend", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response as unknown as BaristaRecommendResponse;
}

