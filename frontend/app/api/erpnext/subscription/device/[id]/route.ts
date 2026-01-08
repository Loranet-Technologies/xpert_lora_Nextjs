import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

// DELETE - Remove device from subscription
export async function DELETE(
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

    const { id } = await params;
    const subscriptionDeviceId = id;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "disable";

    if (!subscriptionDeviceId) {
      return NextResponse.json(
        { message: "Subscription Device ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${ERPNEXT_API_URLS.REMOVE_DEVICE_FROM_SUBSCRIPTION}?subscription_device_id=${subscriptionDeviceId}&action=${action}`,
      {
        method: "DELETE",
        headers,
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: any = { message: "Failed to remove device" };

      try {
        errorData = JSON.parse(errorText);
        if (errorData.message && typeof errorData.message === "object") {
          errorData.message =
            errorData.message.exc_message ||
            errorData.message.message ||
            JSON.stringify(errorData.message);
        }
      } catch {
        errorData = { message: errorText || "Failed to remove device" };
      }

      return NextResponse.json(
        { message: errorData.message || "Failed to remove device" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data.message || data);
  } catch (error) {
    console.error("ERPNext remove device error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
