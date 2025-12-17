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

    // Get query parameters for list_applications
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

    const response = await fetch(
      `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.list_applications`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      }
    );

    // If the method endpoint fails, fall back to resource endpoint with filters
    if (!response.ok) {
      console.warn(
        `list_applications method failed (${response.status}), falling back to resource endpoint`
      );

      // Build resource endpoint URL with filters
      let resourceUrl = `${ERPNext_BASE_URL}/api/resource/Application?fields=${encodeURIComponent(
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
        // Transform resource endpoint response to match list_applications format
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
      let errorData: any = { message: "Failed to fetch applications" };

      try {
        errorData = JSON.parse(errorText);
        if (errorData.message && typeof errorData.message === "object") {
          errorData.message =
            errorData.message.exc_message ||
            errorData.message.message ||
            JSON.stringify(errorData.message);
        }
      } catch {
        errorData = { message: errorText || "Failed to fetch applications" };
      }

      return NextResponse.json(
        { message: errorData.message || "Failed to fetch applications" },
        { status: response.status }
      );
    }

    const data = await response.json();
    // ERPNext API methods return { message: {...} }, unwrap it
    return NextResponse.json(data.message || data);
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

// POST - Create a new application
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
      `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.create_application`,
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
      let errorData: any = { message: "Failed to create application" };

      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || "Failed to create application" };
      }

      console.error(
        `Failed to create application: ${response.status} - ${errorData.message}`
      );

      return NextResponse.json(
        { message: errorData.message || "Failed to create application" },
        { status: response.status }
      );
    }

    const data = await response.json();
    // ERPNext API methods return { message: {...} }, unwrap it
    const result = data.message || data;

    // If chirpstack_id is missing, wait a bit and fetch the application again
    // This handles cases where the sync happens asynchronously in the after_insert hook
    if (!result.chirpstack_id && result.name) {
      console.warn(
        "chirpstack_id missing in initial response, waiting for sync..."
      );
      // Wait 1 second for sync to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Fetch the application again to get updated chirpstack_id
      try {
        const getResponse = await fetch(
          `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_application`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              application_id: result.name,
            }),
          }
        );

        if (getResponse.ok) {
          const getData = await getResponse.json();
          const updatedApplication = getData.message || getData;
          if (updatedApplication.chirpstack_id) {
            result.chirpstack_id = updatedApplication.chirpstack_id;
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
        console.warn("Failed to fetch updated application:", e);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("ERPNext application CREATE error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
