import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";
import {
  parseErpNextError,
  getPaymentErrorMessage,
} from "@/lib/api/utils/parseErpNextError";

/**
 * POST - Create a Stripe PaymentIntent for an ERPNext Payment Request.
 * Proxies to ERPNext create_stripe_payment_intent (allow_guest). No login required for payment page.
 * Body: { payment_request_name: string }
 * Returns: { client_secret, publishable_key, payment_request, amount, currency }
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "")?.trim() || null;

    const body = await request.json();
    const paymentRequestName = body.payment_request_name;

    if (!paymentRequestName || typeof paymentRequestName !== "string") {
      return NextResponse.json(
        { message: "payment_request_name is required" },
        { status: 400 },
      );
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      if (token.startsWith("Token ")) {
        headers["Authorization"] = token;
      } else if (token.includes(":")) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        headers["Cookie"] = `sid=${token}`;
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    // When no token, ERPNext create_stripe_payment_intent(allow_guest=True) handles guest

    const response = await fetch(
      ERPNEXT_API_URLS.CREATE_STRIPE_PAYMENT_INTENT,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ payment_request_name: paymentRequestName }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let rawMessage = "Failed to create payment intent";

      try {
        const errorData = JSON.parse(errorText);
        const extracted = parseErpNextError(errorText, rawMessage);
        if (extracted && extracted !== rawMessage) {
          rawMessage = extracted;
        } else if (errorData.message) {
          rawMessage =
            typeof errorData.message === "string"
              ? errorData.message
              : (errorData.message as { exc_message?: string }).exc_message ||
                (errorData.message as { message?: string }).message ||
                JSON.stringify(errorData.message);
        } else if (errorData.exc_message) {
          rawMessage = errorData.exc_message;
        }
      } catch {
        rawMessage = errorText || rawMessage;
      }

      const message = getPaymentErrorMessage(rawMessage);

      return NextResponse.json({ message }, { status: response.status });
    }

    const data = await response.json();
    // Frappe API returns { message: <result> } for whitelisted methods
    const result = data.message ?? data;
    return NextResponse.json(result);
  } catch (error) {
    console.error("ERPNext create_stripe_payment_intent error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
