import { auth } from "@/lib/firebase/auth";
import { BaristaRecommendResponse } from "@/types/barista";
import { API_BASE_URL } from "@/lib/api-config";

/**
 * Frontend API Client Helper
 * Configured for communication with the Express backend on Render / local development.
 * Uses the centralized API_BASE_URL — never hardcode localhost directly here.
 */

const BACKEND_URL = API_BASE_URL;

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

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  const method = (options.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type for requests with a payload (POST, PUT, PATCH)
  if (method !== "GET" && method !== "HEAD" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // Inject current Firebase ID Token if user is authenticated
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers["Authorization"] = `Bearer ${token}`;
    } catch (err) {
      console.warn("[API Client]: Failed to retrieve Firebase ID token:", err);
    }
  }

  // Inject guest session ID if present (only when mutating or specifically required by barista/orders)
  if (typeof window !== "undefined") {
    let guestSession = sessionStorage.getItem("ai_cafe_guest_session_id");
    if (!guestSession) {
      guestSession = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem("ai_cafe_guest_session_id", guestSession);
    }
    if (method !== "GET" || endpoint.includes("barista") || endpoint.includes("order")) {
      headers["x-guest-session-id"] = guestSession;
    }
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const targetUrl = `${BACKEND_URL}${cleanEndpoint}`;

  // Configure non-blocking abort timeout
  const timeoutMs = options.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (options.signal) {
    options.signal.addEventListener("abort", () => controller.abort());
  }

  try {
    const res = await fetch(targetUrl, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timer);

    const text = await res.text();
    let body: any;
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      return {
        success: false,
        error: {
          code: res.status >= 500 ? "SERVER_ERROR" : "INVALID_RESPONSE",
          message:
            res.status === 502 || res.status === 504
              ? "The backend is temporarily waking up from sleep mode (HTTP 504 Gateway Timeout). Please retry in a moment."
              : `Server returned non-JSON response (HTTP ${res.status}).`,
        },
      };
    }

    if (!res.ok && !body.error) {
      body.success = false;
      body.error = {
        code: `HTTP_${res.status}`,
        message: body.message || `Backend service returned status ${res.status}.`,
      };
    }

    return body as ApiResponse<T>;
  } catch (err: unknown) {
    clearTimeout(timer);

    if ((err as Error).name === "AbortError") {
      return {
        success: false,
        error: {
          code: "TIMEOUT",
          message: `Request to backend timed out after ${Math.round(timeoutMs / 1000)}s. Please try again.`,
        },
      };
    }

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
  conversation: Array<{ role: "user" | "assistant"; content: string }> = [],
  preferences?: import("@/types/barista").BaristaPreferences,
  recentProductIds: string[] = [],
  activeProductId?: string
): Promise<BaristaRecommendResponse> {
  const payload = {
    message,
    conversation: conversation.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    })),
    preferences: preferences || undefined,
    recentProductIds: recentProductIds.length > 0 ? recentProductIds : undefined,
    activeProductId: activeProductId || undefined,
  };

  const response = await apiFetch<BaristaRecommendResponse>("/api/barista/recommend", {
    method: "POST",
    body: JSON.stringify(payload),
    timeoutMs: 20000,
  });

  return response as unknown as BaristaRecommendResponse;
}

/**
 * Customer Commerce API Helpers
 * Uses short non-blocking timeouts for secondary data to never freeze navigation.
 */
export async function fetchFavorites() {
  return apiFetch<{ favorites: any[] }>("/api/favorites", { timeoutMs: 6000 });
}

export async function addFavoriteApi(productId: string) {
  return apiFetch<{ favorites: string[] }>(`/api/favorites/${productId}`, {
    method: "POST",
    timeoutMs: 8000,
  });
}

export async function removeFavoriteApi(productId: string) {
  return apiFetch<{ favorites: string[] }>(`/api/favorites/${productId}`, {
    method: "DELETE",
    timeoutMs: 8000,
  });
}

export async function fetchSavedDrinks() {
  return apiFetch<{ savedDrinks: any[] }>("/api/saved-drinks", { timeoutMs: 6000 });
}

export async function saveDrinkApi(payload: {
  name: string;
  configuration: any;
  notes?: string;
}) {
  return apiFetch<{ savedDrink: any }>("/api/saved-drinks", {
    method: "POST",
    body: JSON.stringify(payload),
    timeoutMs: 10000,
  });
}

export async function deleteSavedDrinkApi(id: string) {
  return apiFetch<{ success: boolean }>(`/api/saved-drinks/${id}`, {
    method: "DELETE",
    timeoutMs: 8000,
  });
}

export async function fetchCustomerOrders() {
  return apiFetch<{ orders: any[] }>("/api/orders", { timeoutMs: 6000 });
}

export async function fetchOrderById(orderId: string) {
  return apiFetch<{ order: any }>(`/api/orders/${orderId}`, { timeoutMs: 8000 });
}


