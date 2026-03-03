import { NextRequest, NextResponse } from "next/server";
import { BASE_URLS } from "@/lib/config/api.config";
import {
  parseErpNextError,
  getPaymentErrorMessage,
} from "@/lib/api/utils/parseErpNextError";

/**
 * POST - Complete Razorpay payment for plan (Build Integration).
 * Proxies to ERPNext xpert_lora_app.api.complete_razorpay_payment_for_plan (allow_guest).
 *
 * Body: {
 *   integration_request: string;
 *   razorpay_payment_id: string;
 *   razorpay_order_id: string;
 *   razorpay_signature: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "")?.trim() || null;

    const body = await request.json();
    const {
      integration_request,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = body || {};

    if (
      !integration_request ||
      !razorpay_payment_id ||
      !razorpay_order_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        {
          message:
            "integration_request, razorpay_payment_id, razorpay_order_id and razorpay_signature are required",
        },
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

    const url = `${BASE_URLS.ERPNEXT}/api/method/xpert_lora_app.api.complete_razorpay_payment_for_plan`;

    const payload = {
      integration_request,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let rawMessage = "Failed to complete Razorpay payment";

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

    // We don't care about the body for now; just surface success.
    await response.text().catch(() => "");

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ERPNext complete_razorpay_payment_for_plan error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

