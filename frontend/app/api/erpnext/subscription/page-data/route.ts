import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

/**
 * GET - Get all data for the Subscription page in one call.
 * Proxies to xpert_lora_app.api.get_subscription_page_data.
 * Returns: { success, has_subscription, organizations, plans }
 * Frontend shows loading until this returns, then renders "My Subscriptions" or "All Plans" with no flash.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "")?.trim() || null;

    if (!token) {
      return NextResponse.json(
        { message: "Authorization token required" },
        { status: 401 },
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

    const response = await fetch(ERPNEXT_API_URLS.GET_SUBSCRIPTION_PAGE_DATA, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const errorData: { message?: string } = {
        message: "Failed to get subscription page data",
      };
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.message && typeof parsed.message === "object") {
          errorData.message =
            parsed.message.exc_message ||
            parsed.message.message ||
            JSON.stringify(parsed.message);
        } else if (parsed.message) {
          errorData.message = parsed.message;
        }
      } catch {
        errorData.message = errorText || errorData.message;
      }
      return NextResponse.json(
        {
          message:
            errorData.message || "Failed to get subscription page data",
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    // Frappe wraps whitelisted method return value in message
    const payload = data.message ?? data;
    return NextResponse.json({
      success: payload.success !== false,
      has_subscription: Boolean(payload.has_subscription),
      has_active_subscription: Boolean(payload.has_active_subscription),
      can_subscribe: Boolean(payload.can_subscribe),
      organizations: payload.organizations || [],
      organizations_for_subscribe: payload.organizations_for_subscribe || [],
      plans: payload.plans || [],
    });
  } catch (error) {
    console.error("ERPNext get subscription page data error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
