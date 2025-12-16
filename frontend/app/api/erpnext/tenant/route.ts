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

    // Get query parameters for list_tenants
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const filtersParam = searchParams.get("filters");

    // Parse filters if provided
    let filters = null;
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam);
      } catch {
        filters = filtersParam;
      }
    }

    // Try using the list_tenants API method first with GET and query parameters
    // ERPNext API methods can be called with GET and query parameters
    let queryParams = `limit=${limit}&offset=${offset}`;
    if (filters !== null) {
      queryParams += `&filters=${encodeURIComponent(
        typeof filters === "string" ? filters : JSON.stringify(filters)
      )}`;
    }

    let response = await fetch(
      `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.list_tenants?${queryParams}`,
      {
        method: "GET",
        headers,
      }
    );

    // If GET fails, try POST with JSON body
    if (!response.ok) {
      console.warn(`list_tenants GET failed (${response.status}), trying POST`);
      const requestBody: any = {
        limit,
        offset,
      };
      if (filters !== null) {
        requestBody.filters =
          typeof filters === "string" ? filters : JSON.stringify(filters);
      }

      response = await fetch(
        `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.list_tenants`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
        }
      );
    }

    // If the method endpoint still fails, fall back to resource endpoint
    if (!response.ok) {
      console.warn(
        `list_tenants method failed (${response.status}), falling back to resource endpoint`
      );
      const fields = searchParams.get("fields") || '["*"]';
      const fallbackResponse = await fetch(
        `${ERPNext_BASE_URL}/api/resource/Tenant?fields=${encodeURIComponent(
          fields
        )}&limit_page_length=${limit}&limit_start=${offset}`,
        {
          method: "GET",
          headers,
        }
      );

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        // Transform resource endpoint response to match list_tenants format
        return NextResponse.json({
          data: fallbackData.data || [],
          total: fallbackData.data?.length || 0,
          limit,
          offset,
        });
      }
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: any = { message: "Failed to fetch tenants" };

      try {
        errorData = JSON.parse(errorText);
        // ERPNext error responses are wrapped in { message: { exc_type, exc_message, ... } }
        if (errorData.message && typeof errorData.message === "object") {
          errorData.message =
            errorData.message.exc_message ||
            errorData.message.message ||
            JSON.stringify(errorData.message);
        }
      } catch {
        errorData = { message: errorText || "Failed to fetch tenants" };
      }

      const errorMessage =
        errorData.message ||
        errorData.exc_message ||
        `HTTP ${response.status}: ${errorText}`;
      console.error(
        `Failed to fetch tenants: ${response.status} - ${errorMessage}`,
        { errorText, errorData }
      );

      return NextResponse.json(
        { message: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    // ERPNext API methods return { message: {...} }, unwrap it
    return NextResponse.json(data.message || data);
  } catch (error) {
    console.error("ERPNext tenant proxy error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new tenant
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Determine token type and format headers accordingly
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token.startsWith("Token ")) {
      headers["Authorization"] = token;
    } else if (token.includes(":")) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      headers["Cookie"] = `sid=${token}`;
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Forward the request to ERPNext
    const response = await fetch(
      `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.create_tenant`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          data: body,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: any = { message: "Failed to create tenant" };

      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || "Failed to create tenant" };
      }

      console.error(
        `Failed to create tenant: ${response.status} - ${errorData.message}`
      );

      return NextResponse.json(
        { message: errorData.message || "Failed to create tenant" },
        { status: response.status }
      );
    }

    const data = await response.json();
    // ERPNext API methods return { message: {...} }, unwrap it
    let result = data.message || data;

    // If chirpstack_id is missing, wait a bit and fetch the tenant again
    // This handles cases where the sync happens asynchronously in the after_insert hook
    if (!result.chirpstack_id && result.name) {
      console.warn(
        "chirpstack_id missing in initial response, waiting for sync..."
      );
      // Wait 1 second for sync to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Fetch the tenant again to get updated chirpstack_id
      try {
        const getResponse = await fetch(
          `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_tenant`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              tenant_id: result.name,
            }),
          }
        );

        if (getResponse.ok) {
          const getData = await getResponse.json();
          const updatedTenant = getData.message || getData;
          if (updatedTenant.chirpstack_id) {
            result.chirpstack_id = updatedTenant.chirpstack_id;
            console.log(
              "Retrieved chirpstack_id after sync:",
              result.chirpstack_id
            );
          } else {
            console.warn(
              "chirpstack_id still missing after retry - ChirpStack sync may have failed"
            );
          }
        }
      } catch (e) {
        console.warn("Failed to fetch updated tenant:", e);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("ERPNext tenant CREATE error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
