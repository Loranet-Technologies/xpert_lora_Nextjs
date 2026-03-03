import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";
import {
  parseErpNextError,
  getPaymentErrorMessage,
} from "@/lib/api/utils/parseErpNextError";

/**
 * POST - Pay-first flow: create Stripe PaymentIntent for organization + plan (no subscription yet).
 * Backend creates Sales Invoice + Payment Request + PaymentIntent with metadata (subscription_plan, organization).
 * On payment success, webhook creates the Subscription.
 * Body: { organization: string, plan: string, amount?: number }
 * Returns: { client_secret, publishable_key, payment_request, amount, currency, sales_invoice? }
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "")?.trim() || null;

    const body = await request.json();
    const organization = body.organization;
    const plan = body.plan;
    const amount = body.amount;

    if (!organization || typeof organization !== "string") {
      return NextResponse.json(
        { message: "organization is required" },
        { status: 400 },
      );
    }
    if (!plan || typeof plan !== "string") {
      return NextResponse.json(
        { message: "plan is required" },
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

    const payload: { organization: string; plan: string; amount?: number } = {
      organization,
      plan,
    };
    if (typeof amount === "number" && amount > 0) {
      payload.amount = amount;
    }

    const response = await fetch(ERPNEXT_API_URLS.CREATE_PAYMENT_INTENT_FOR_PLAN, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let rawMessage = "Failed to create payment";

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

      return NextResponse.json(
        { message: getPaymentErrorMessage(rawMessage) },
        { status: response.status },
      );
    }

    const data = await response.json();
    const result = data.message ?? data;
    return NextResponse.json(result);
  } catch (error) {
    console.error("ERPNext create_payment_intent_for_plan error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
