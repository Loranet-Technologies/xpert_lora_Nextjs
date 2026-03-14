import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

/**
 * GET - Subscription Service Dashboard: all data in one call.
 * Proxies to xpert_lora_app.subscription_dashboard.get_subscription_dashboard_all.
 * Query: months (default 12), top_customers_limit (default 10), days_ahead (default 30).
 * Returns: { success, data: { kpis, revenue_analytics, subscription_metrics, customer_insights, payment_billing_status, plan_performance, churn_analysis, alerts } }
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

    const { searchParams } = new URL(request.url);
    const months = searchParams.get("months") ?? "12";
    const top_customers_limit = searchParams.get("top_customers_limit") ?? "10";
    const days_ahead = searchParams.get("days_ahead") ?? "30";

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

    const url = new URL(ERPNEXT_API_URLS.GET_SUBSCRIPTION_DASHBOARD_ALL);
    url.searchParams.set("months", months);
    url.searchParams.set("top_customers_limit", top_customers_limit);
    url.searchParams.set("days_ahead", days_ahead);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const errorData: { message?: string } = {
        message: "Failed to get subscription dashboard data",
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
            errorData.message || "Failed to get subscription dashboard data",
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    const payload = data.message ?? data;
    return NextResponse.json({
      success: payload.success !== false,
      data: payload.data ?? {},
    });
  } catch (error) {
    console.error("ERPNext subscription dashboard error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
