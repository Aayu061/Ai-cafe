import { auth } from "@/lib/firebase/auth";

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
