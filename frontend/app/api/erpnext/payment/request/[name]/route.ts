import { NextRequest, NextResponse } from "next/server";
import { getErpNextUrl } from "@/lib/config/api.config";

/**
 * GET - Fetch Payment Request status from ERPNext.
 * Used after Stripe redirect to confirm webhook has marked the request as Paid.
 * Auth optional (guest pay page may poll without login; ERPNext may still require login for Payment Request read).
 * Returns: { name, status, grand_total, currency, ... }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "")?.trim() || null;

    const { name } = await params;
    if (!name) {
      return NextResponse.json(
        { message: "Payment Request name is required" },
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

    const url = getErpNextUrl.PAYMENT_REQUEST_BY_ID(name);
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return NextResponse.json(
        { message: errorText || "Payment Request not found" },
        { status: response.status },
      );
    }

    const data = await response.json();
    const doc = data.data || data;
    return NextResponse.json({
      name: doc.name,
      status: doc.status,
      grand_total: doc.grand_total,
      currency: doc.currency,
      outstanding_amount: doc.outstanding_amount,
    });
  } catch (error) {
    console.error("ERPNext get Payment Request error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
