import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

/**
 * GET — Payment Transaction Log list (newest first).
 * Proxies to xpert_lora_app.api.get_payment_billing_logs.
 *
 * Query (all optional except auth): status, from_date, to_date, limit, start, include_payload.
 * Access is enforced by ERPNext read permission on Payment Transaction Log.
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

    const url = `${ERPNEXT_API_URLS.GET_PAYMENT_BILLING_LOGS}?${searchParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: { message?: string } = {
        message: "Failed to get payment billing logs",
      };
      try {
        errorData = JSON.parse(errorText);
        if (errorData.message && typeof errorData.message === "object") {
          errorData.message =
            (errorData.message as { exc_message?: string }).exc_message ??
            (errorData.message as { message?: string }).message ??
            String(errorData.message);
        }
      } catch {
        errorData = {
          message: errorText || "Failed to get payment billing logs",
        };
      }
      return NextResponse.json(
        { message: errorData.message || "Failed to get payment billing logs" },
        { status: response.status },
      );
    }

    const data = await response.json();
    const payload = data.message ?? data;
    const rows = Array.isArray(payload.data) ? payload.data : [];
    const total =
      typeof payload.total === "number" ? payload.total : rows.length;
    return NextResponse.json({
      success: payload.success !== false,
      data: rows,
      total,
    });
  } catch (error) {
    console.error("ERPNext payment-billing-logs GET error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
