import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

/**
 * POST - Get or create a Payment Request for a subscription (built-in Subscription).
 * Body: { subscription_name: string, amount?: number }
 * Returns: { payment_request: string, amount?: number, currency?: string }
 * So the frontend can redirect to /pages/pay/{payment_request} for Stripe payment.
 * Pass amount when the plan has no cost (backend uses it for invoice).
 */
export async function POST(request: NextRequest) {
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
    const subscriptionName = body.subscription_name;
    const amount = body.amount != null ? Number(body.amount) : undefined;

    if (!subscriptionName || typeof subscriptionName !== "string") {
      return NextResponse.json(
        { message: "subscription_name is required" },
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

    const payload: { subscription_name: string; amount?: number } = {
      subscription_name: subscriptionName,
    };
    if (amount != null && !Number.isNaN(amount) && amount > 0) {
      payload.amount = amount;
    }

    const response = await fetch(
      ERPNEXT_API_URLS.GET_PAYMENT_REQUEST_FOR_SUBSCRIPTION,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: { message?: string | object; exc_message?: string; exc?: string } = {
        message: "Failed to get payment request",
      };
      try {
        errorData = JSON.parse(errorText);
        if (errorData.message && typeof errorData.message === "object") {
          const m = errorData.message as { exc_message?: string; message?: string };
          errorData.message = m.exc_message || m.message || JSON.stringify(errorData.message);
        }
      } catch {
        errorData = { message: errorText || "Failed to get payment request" };
      }
      const msg =
        (typeof errorData.message === "string" ? errorData.message : null) ||
        errorData.exc_message ||
        errorData.exc ||
        (errorText && errorText.length < 300 ? errorText : null) ||
        `Payment request failed (${response.status}). Check server logs or ERPNext Error Log.`;
      console.error("[subscription/payment-request] ERPNext error:", response.status, errorText?.slice(0, 500));
      return NextResponse.json({ message: msg }, { status: response.status });
    }

    const data = await response.json();
    const result = data.message ?? data;
    return NextResponse.json(result);
  } catch (error) {
    console.error("ERPNext get_payment_request_for_subscription error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
