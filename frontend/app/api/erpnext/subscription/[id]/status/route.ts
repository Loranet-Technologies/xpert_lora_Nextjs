import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

// PATCH - Update subscription status
export async function PATCH(
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

    const body = await request.json();
    const { id } = await params;
    const subscriptionId = id;
    const status = body.status;

    if (!subscriptionId) {
      return NextResponse.json(
        { message: "Subscription ID is required" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { message: "Status is required" },
        { status: 400 }
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

    const response = await fetch(
      `${ERPNEXT_API_URLS.UPDATE_SUBSCRIPTION_STATUS}?subscription_id=${subscriptionId}&status=${status}`,
      {
        method: "PATCH",
        headers,
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: any = { message: "Failed to update subscription status" };

      try {
        errorData = JSON.parse(errorText);
        if (errorData.message && typeof errorData.message === "object") {
          errorData.message =
            errorData.message.exc_message ||
            errorData.message.message ||
            JSON.stringify(errorData.message);
        }
      } catch {
        errorData = { message: errorText || "Failed to update subscription status" };
      }

      return NextResponse.json(
        { message: errorData.message || "Failed to update subscription status" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data.message || data);
  } catch (error) {
    console.error("ERPNext subscription status update error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

