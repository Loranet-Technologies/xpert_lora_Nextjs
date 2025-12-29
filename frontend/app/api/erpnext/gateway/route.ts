import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

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
    const filtersParam = searchParams.get("filters");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Parse filters if provided
    let filters = null;
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam);
      } catch {
        filters = filtersParam;
      }
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

    // Use list_gateways API method if filters, limit, or offset are provided
    // Otherwise, fall back to resource API
    if (filters !== null || limit !== 20 || offset !== 0) {
      // Use list_gateways API method
      const body: any = {
        limit,
        offset,
      };
      if (filters !== null) {
        body.filters = JSON.stringify(filters);
      }

      const response = await fetch(ERPNEXT_API_URLS.LIST_GATEWAYS, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        let errorData: any = { message: "Failed to fetch gateways" };

        try {
          errorData = JSON.parse(errorText);
          if (errorData.message && typeof errorData.message === "object") {
            errorData.message =
              errorData.message.exc_message ||
              errorData.message.message ||
              JSON.stringify(errorData.message);
          }
        } catch {
          errorData = { message: errorText || "Failed to fetch gateways" };
        }

        return NextResponse.json(
          { message: errorData.message || "Failed to fetch gateways" },
          { status: response.status }
        );
      }

      const data = await response.json();
      // ERPNext API methods return { message: {...} }, unwrap it
      return NextResponse.json(data.message || data);
    } else {
      // Fall back to resource API for simple queries
      const fields = searchParams.get("fields") || '["*"]';
      let url = `${ERPNEXT_API_URLS.GATEWAY_RESOURCE}?fields=${encodeURIComponent(fields)}`;
      if (filtersParam) {
        url += `&filters=${encodeURIComponent(filtersParam)}`;
      }

      // Forward the request to ERPNext
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        let errorData: any = { message: "Failed to fetch gateways" };

        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || "Failed to fetch gateways" };
        }

        console.error(
          `Failed to fetch gateways: ${response.status} - ${errorData.message}`
        );

        return NextResponse.json(
          { message: errorData.message || "Failed to fetch gateways" },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error("ERPNext gateway proxy error:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

