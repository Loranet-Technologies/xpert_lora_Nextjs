import { NextRequest, NextResponse } from "next/server";

const ERPNext_BASE_URL =
  process.env.NEXT_PUBLIC_ERPNEXT_URL || "https://erp.xperts.loranet.my";

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || null;

    if (!token) {
      return NextResponse.json(
        { message: "Authorization token required" },
        { status: 401 }
      );
    }

    // Get query parameters from the request
    const { searchParams } = new URL(request.url);
    const fields = searchParams.get("fields") || '["*"]';
    const filters = searchParams.get("filters");

    // Build the URL with query parameters
    let url = `${ERPNext_BASE_URL}/api/resource/Application?fields=${encodeURIComponent(
      fields
    )}`;
    if (filters) {
      url += `&filters=${encodeURIComponent(filters)}`;
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
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: any = { message: "Failed to fetch applications" };
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || "Failed to fetch applications" };
      }

      console.error(
        `Failed to fetch applications: ${response.status} - ${errorData.message}`
      );
      
      return NextResponse.json(
        { message: errorData.message || "Failed to fetch applications" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("ERPNext application proxy error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
