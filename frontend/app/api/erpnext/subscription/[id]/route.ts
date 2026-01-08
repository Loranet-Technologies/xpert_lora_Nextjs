import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

// GET - Get subscription by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || null;

    if (!token) {
      return NextResponse.json(
        { message: "Authorization token required" },
        { status: 401 }
      );
    }

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

    const { searchParams } = new URL(request.url);
    const { id } = await params;
    const subscriptionId = id || searchParams.get("subscription_id");

    if (!subscriptionId) {
      return NextResponse.json(
        { message: "Subscription ID is required" },
        { status: 400 }
      );
    }

    // ERPNext API method expects GET with subscription_id as query parameter
    const response = await fetch(
      `${ERPNEXT_API_URLS.GET_SUBSCRIPTION}?subscription_id=${subscriptionId}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: any = { message: "Failed to get subscription" };

      try {
        errorData = JSON.parse(errorText);
        if (errorData.message && typeof errorData.message === "object") {
          errorData.message =
            errorData.message.exc_message ||
            errorData.message.message ||
            JSON.stringify(errorData.message);
        }
      } catch {
        errorData = { message: errorText || "Failed to get subscription" };
      }

      return NextResponse.json(
        { message: errorData.message || "Failed to get subscription" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data.message || data);
  } catch (error) {
    console.error("ERPNext subscription GET error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
