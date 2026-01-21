import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

// GET - Get a single gateway by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const gatewayId = id;

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
    // ERPNext API methods use POST, with parameters in the body
    const response = await fetch(ERPNEXT_API_URLS.GET_GATEWAY, {
        method: "POST",
        headers,
        body: JSON.stringify({
          gateway_id: gatewayId,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: any = { message: "Failed to fetch gateway" };

      try {
        errorData = JSON.parse(errorText);
        if (errorData.message && typeof errorData.message === "object") {
          errorData.message =
            errorData.message.exc_message ||
            errorData.message.message ||
            JSON.stringify(errorData.message);
        }
      } catch {
        errorData = { message: errorText || "Failed to fetch gateway" };
      }

      return NextResponse.json(
        { message: errorData.message || "Failed to fetch gateway" },
        { status: response.status }
      );
    }

    const data = await response.json();
    // ERPNext API methods return { message: {...} }, unwrap it
    return NextResponse.json(data.message || data);
  } catch (error) {
    console.error("ERPNext gateway GET error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

