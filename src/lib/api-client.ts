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

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
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
  });

  return response as unknown as BaristaRecommendResponse;
}

/**
 * Customer Commerce API Helpers
 */
export async function fetchFavorites() {
  return apiFetch<{ favorites: any[] }>("/api/favorites");
}

export async function addFavoriteApi(productId: string) {
  return apiFetch<{ favorites: string[] }>(`/api/favorites/${productId}`, {
    method: "POST",
  });
}

export async function removeFavoriteApi(productId: string) {
  return apiFetch<{ favorites: string[] }>(`/api/favorites/${productId}`, {
    method: "DELETE",
  });
}

export async function fetchSavedDrinks() {
  return apiFetch<{ savedDrinks: any[] }>("/api/saved-drinks");
}

export async function saveDrinkApi(payload: {
  name: string;
  configuration: any;
  notes?: string;
}) {
  return apiFetch<{ savedDrink: any }>("/api/saved-drinks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteSavedDrinkApi(id: string) {
  return apiFetch<{ success: boolean }>(`/api/saved-drinks/${id}`, {
    method: "DELETE",
  });
}

export async function fetchCustomerOrders() {
  return apiFetch<{ orders: any[] }>("/api/orders");
}

export async function fetchOrderById(orderId: string) {
  return apiFetch<{ order: any }>(`/api/orders/${orderId}`);
}

