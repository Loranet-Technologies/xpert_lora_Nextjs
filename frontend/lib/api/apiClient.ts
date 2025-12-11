import React from "react";
import { useAuth } from "../auth/AuthProvider";
import Cookies from "js-cookie";

// API client that automatically includes authorization headers
class ApiClient {
  private baseUrl: string;
  private getToken: (() => string | null) | null = null;

  constructor(baseUrl?: string) {
    // Use environment variable if available, otherwise fallback to default
    this.baseUrl =
      baseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";
  }

  // Set the token getter function
  setTokenGetter(getToken: () => string | null) {
    this.getToken = getToken;
  }

  // Get token from multiple sources
  private getTokenFromSources(): string | null {
    // First try the token getter (from useAuth hook)
    if (this.getToken) {
      const token = this.getToken();
      if (token) {
        return token;
      }
    }

    // Fallback to cookies
    const cookieToken = Cookies.get("keycloak_token");
    if (cookieToken) {
      return cookieToken;
    }

    // Fallback to localStorage
    const localToken = localStorage.getItem("keycloak_token");
    if (localToken) {
      return localToken;
    }

    return null;
  }

  // Get headers with authorization
  private getHeaders(
    additionalHeaders: Record<string, string> = {}
  ): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...additionalHeaders,
    };

    // Add authorization header if token is available
    const token = this.getTokenFromSources();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders(options.headers as Record<string, string>);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        // If 401, try to refresh token and retry once
        if (response.status === 401) {
          console.warn("Received 401, attempting token refresh...");

          // Try to refresh token by calling the refresh endpoint
          try {
            await this.refreshToken();

            // Retry the request with new token
            const newHeaders = this.getHeaders(
              options.headers as Record<string, string>
            );
            const retryResponse = await fetch(url, {
              ...options,
              headers: newHeaders,
            });

            if (retryResponse.ok) {
              return await retryResponse.json();
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Refresh token method
  private async refreshToken(): Promise<void> {
    try {
      // Try to get refresh token from cookies
      const refreshToken = Cookies.get("keycloak_refresh_token");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // Call Keycloak token refresh endpoint
      const keycloakUrl =
        process.env.NEXT_PUBLIC_KEYCLOAK_URL || "https://keycloak.loranet.my";
      const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "loranet_xperts";
      const clientId =
        process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "loranet_xperts";

      const response = await fetch(
        `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: clientId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();

      // Update stored tokens
      Cookies.set("keycloak_token", data.access_token, { expires: 1 });
      if (data.refresh_token) {
        Cookies.set("keycloak_refresh_token", data.refresh_token, {
          expires: 7,
        });
      }

      console.log("Token refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh token:", error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, value.toString());
        }
      });
    }

    const url = `${endpoint}${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;
    return this.request<T>(url, { method: "GET" });
  }

  // POST request
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

// Create singleton instance with environment variable support
export const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL);

// Hook to initialize API client with auth token
export function useApiClient() {
  const { token } = useAuth();

  // Update token getter when token changes
  React.useEffect(() => {
    apiClient.setTokenGetter(() => token);
  }, [token]);

  return apiClient;
}

// Re-export for convenience
export { apiClient as default };
