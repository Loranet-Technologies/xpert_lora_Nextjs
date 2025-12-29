import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { message: "Username is required" },
        { status: 400 }
      );
    }

    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || null;

    if (!token) {
      return NextResponse.json(
        { message: "Authorization token required" },
        { status: 401 }
      );
    }

    // Determine token type and format headers accordingly
    // ERPNext accepts:
    // 1. API Token: "Token api_key:api_secret" in Authorization header
    // 2. Session ID: "sid" in Cookie header
    // 3. Keycloak token: Bearer token (validated by auth hook)
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token.startsWith("Token ")) {
      // ERPNext API token format
      headers["Authorization"] = token;
    } else if (token.includes(":")) {
      // Might be an API token without "Token " prefix, or Keycloak token
      // Try as Bearer token first (for Keycloak), auth hook will validate
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      // Likely a session ID
      headers["Cookie"] = `sid=${token}`;
      // Also try as Bearer token for Keycloak compatibility
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Forward the request to ERPNext
    const response = await fetch(`${ERPNEXT_API_URLS.USER_RESOURCE}/${username}`, {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(
        `Failed to fetch user details: ${response.status} - ${errorText}`
      );
      return NextResponse.json(
        { message: "Failed to fetch user details" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("ERPNext user details proxy error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

