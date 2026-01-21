import { getERPNextToken } from "../utils/token";

// ERPNext Authentication API - Using Next.js API proxy to avoid CORS issues
export async function loginWithERPNext(credentials: {
  usr: string;
  pwd: string;
}) {
  try {
    // Use Next.js API route as proxy to avoid CORS issues
    const response = await fetch("/api/erpnext/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
      credentials: "include", // Important for cookie-based sessions
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Login failed",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to login with ERPNext:", error);
    throw error;
  }
}

// Re-export token utility for convenience
export { getERPNextToken } from "../utils/token";

