import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

/**
 * GET - Pay-first flow: get payment status for a Payment Request.
 * Returns: { status, subscription_name?, can_pay_again, can_cancel }
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "")?.trim() || null;

    const { searchParams } = new URL(request.url);
    const paymentRequestName = searchParams.get("payment_request_name");

    if (!paymentRequestName) {
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

    const url = `${ERPNEXT_API_URLS.GET_PAYMENT_STATUS}?payment_request_name=${encodeURIComponent(paymentRequestName)}`;
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return NextResponse.json(
        { message: errorText || "Failed to get payment status" },
        { status: response.status },
      );
    }

    const data = await response.json();
    const result = data.message ?? data;
    return NextResponse.json(result);
  } catch (error) {
    console.error("ERPNext get_payment_status error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
