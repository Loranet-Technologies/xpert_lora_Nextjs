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

    // Get query parameters for list_device_profiles
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const filtersParam = searchParams.get("filters");
    const fields = searchParams.get("fields") || '["*"]';

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

    // Use POST method with JSON body for better filter support
    const requestBody: any = {
      limit,
      offset,
    };
    if (filters !== null) {
      // Ensure filters are properly formatted as JSON string
      // Frappe expects filters as JSON string: [["field", "operator", "value"]]
      requestBody.filters =
        typeof filters === "string" ? filters : JSON.stringify(filters);
    }

    let response = await fetch(
      `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.list_device_profiles`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      }
    );

    // If the method endpoint fails, fall back to resource endpoint with filters
    if (!response.ok) {
      console.warn(
        `list_device_profiles method failed (${response.status}), falling back to resource endpoint`
      );

      // Build resource endpoint URL with filters
      // Note: ERPNext doctype name is "Device Profile" with a space, so we need to URL encode it
      let resourceUrl = `${ERPNext_BASE_URL}/api/resource/Device%20Profile?fields=${encodeURIComponent(
        fields
      )}&limit_page_length=${limit}&limit_start=${offset}`;

      // Add filters to resource endpoint if provided
      if (filters !== null) {
        const filtersStr =
          typeof filters === "string" ? filters : JSON.stringify(filters);
        resourceUrl += `&filters=${encodeURIComponent(filtersStr)}`;
      }

      const fallbackResponse = await fetch(resourceUrl, {
        method: "GET",
        headers,
      });

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        // Transform resource endpoint response to match list_device_profiles format
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
      let errorData: any = { message: "Failed to fetch device profiles" };

      try {
        errorData = JSON.parse(errorText);
        if (errorData.message && typeof errorData.message === "object") {
          errorData.message =
            errorData.message.exc_message ||
            errorData.message.message ||
            JSON.stringify(errorData.message);
        }
      } catch {
        errorData = { message: errorText || "Failed to fetch device profiles" };
      }

      return NextResponse.json(
        { message: errorData.message || "Failed to fetch device profiles" },
        { status: response.status }
      );
    }

    const data = await response.json();
    // ERPNext API methods return { message: {...} }, unwrap it
    return NextResponse.json(data.message || data);
  } catch (error) {
    console.error("ERPNext device profile proxy error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new device profile
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

    // Ensure region always ends with \n (ERPNext validation requirement)
    if (body.region && typeof body.region === "string") {
      const regionValue = body.region.trim();
      if (!regionValue.endsWith("\n")) {
        body.region = regionValue + "\n";
      } else {
        body.region = regionValue; // Keep as-is if it already has \n
      }
    } else if (!body.region) {
      // If region is not provided, default to AS923\n
      body.region = "AS923\n";
    }

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
      `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.create_device_profile`,
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
      let errorData: any = { message: "Failed to create device profile" };

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
        errorData = { message: errorText || "Failed to create device profile" };
      }

      const errorMessage =
        errorData.message ||
        errorData.exc_message ||
        `HTTP ${response.status}: ${errorText}`;

      console.error(
        `Failed to create device profile: ${response.status} - ${errorMessage}`,
        { errorText, errorData }
      );

      return NextResponse.json(
        { message: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    // ERPNext API methods return { message: {...} }, unwrap it
    let result = data.message || data;

    // If chirpstack_id is missing, wait a bit and fetch the device profile again
    // This handles cases where the sync happens asynchronously in the after_insert hook
    if (!result.chirpstack_id && result.name) {
      console.warn(
        "chirpstack_id missing in initial response, waiting for sync..."
      );
      // Wait 1 second for sync to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Fetch the device profile again to get updated chirpstack_id
      try {
        const getResponse = await fetch(
          `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_device_profile`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              device_profile_id: result.name,
            }),
          }
        );

        if (getResponse.ok) {
          const getData = await getResponse.json();
          const updatedProfile = getData.message || getData;
          if (updatedProfile.chirpstack_id) {
            result.chirpstack_id = updatedProfile.chirpstack_id;
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
        console.warn("Failed to fetch updated device profile:", e);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("ERPNext device profile CREATE error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
