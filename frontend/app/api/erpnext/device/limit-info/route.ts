import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

/**
 * GET ?customer=... (optional) - Returns device limit info.
 * When customer is omitted, backend uses current user's derived customer (User → Organization → Customer).
 * Proxies to xpert_lora_app.api.get_device_limit_info.
 * Response: { current_count, device_limit, has_active_subscription }.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || null;

    if (!token) {
      return NextResponse.json(
        { message: "Authorization token required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const customerParam = searchParams.get("customer");
    const customer =
      customerParam && customerParam.trim() ? customerParam.trim() : null;

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

    const response = await fetch(ERPNEXT_API_URLS.GET_DEVICE_LIMIT_INFO, {
      method: "POST",
      headers,
      body: JSON.stringify(customer ? { customer } : {}),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: any = { message: "Failed to get device limit info" };
      try {
        errorData = JSON.parse(errorText);
        if (errorData.message && typeof errorData.message === "object") {
          errorData.message =
            errorData.message.exc_message ||
            errorData.message.message ||
            JSON.stringify(errorData.message);
        }
      } catch {
        errorData = { message: errorText || "Failed to get device limit info" };
      }
      return NextResponse.json(
        { message: errorData.message || "Failed to get device limit info" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const result = data.message || data;
    return NextResponse.json({
      current_count: result.current_count ?? 0,
      device_limit: result.device_limit ?? null,
      has_active_subscription: result.has_active_subscription ?? false,
    });
  } catch (error) {
    console.error("ERPNext device limit-info error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
