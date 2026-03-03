import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

/**
 * GET - List billing history (Payment Requests) for an organization or subscription.
 * Proxies to xpert_lora_app.api.get_billing_history (Frappe method).
 * Query: organization (org name) or subscription (subscription name).
 * Returns: { data: BillingHistoryItem[] }
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "")?.trim() || null;

    if (!token) {
      return NextResponse.json(
        { message: "Authorization token required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organization = searchParams.get("organization");
    const subscription = searchParams.get("subscription");

    if (!organization && !subscription) {
      return NextResponse.json(
        { message: "Query parameter 'organization' or 'subscription' is required" },
        { status: 400 },
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

    // Proxy to Frappe method: xpert_lora_app.api.get_billing_history
    const url = `${ERPNEXT_API_URLS.GET_BILLING_HISTORY}?${searchParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: { message?: string } = {
        message: "Failed to get billing history",
      };
      try {
        errorData = JSON.parse(errorText);
        if (errorData.message && typeof errorData.message === "object") {
          errorData.message = (errorData.message as any).exc_message ?? (errorData.message as any).message ?? String(errorData.message);
        }
      } catch {
        errorData = { message: errorText || "Failed to get billing history" };
      }
      return NextResponse.json(
        { message: errorData.message || "Failed to get billing history" },
        { status: response.status },
      );
    }

    const data = await response.json();
    const payload = data.message ?? data;
    const list = Array.isArray(payload.data) ? payload.data : [];
    return NextResponse.json({ data: list });
  } catch (error) {
    console.error("ERPNext billing-history GET error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
