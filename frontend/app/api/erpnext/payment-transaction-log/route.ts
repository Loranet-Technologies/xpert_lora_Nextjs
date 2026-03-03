import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

function getAuthHeaders(token: string | null): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (!token) return headers;
  if (token.startsWith("Token ")) headers["Authorization"] = token;
  else if (token.includes(":")) headers["Authorization"] = `Bearer ${token}`;
  else {
    headers["Cookie"] = `sid=${token}`;
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function parseError(response: Response, errorText: string) {
  let errorData: { message?: string | object } = { message: "Request failed" };
  try {
    errorData = JSON.parse(errorText);
    if (errorData.message && typeof errorData.message === "object") {
      errorData.message =
        (errorData.message as { exc_message?: string }).exc_message ||
        (errorData.message as { message?: string }).message ||
        JSON.stringify(errorData.message);
    }
  } catch {
    errorData = { message: errorText || "Request failed" };
  }
  return typeof errorData.message === "string"
    ? errorData.message
    : "Request failed";
}

// GET - List payment transaction logs (read-only)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || null;
    if (!token) {
      return NextResponse.json(
        { message: "Authorization token required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "50";
    const offset = searchParams.get("offset") || "0";
    const paymentRequestFilter = searchParams.get("payment_request");
    const fields =
      searchParams.get("fields") ||
      '["name","payment_request","event_type","gateway_event","gateway_reference","signature_valid","amount","currency","status","merchant","payment_gateway","organization","timestamp","is_processed","error_message"]';

    let url = `${ERPNEXT_API_URLS.PAYMENT_TRANSACTION_LOG_RESOURCE}?fields=${encodeURIComponent(fields)}&limit_page_length=${limit}&limit_start=${offset}&order_by=creation desc`;
    if (paymentRequestFilter) {
      url += `&filters=${encodeURIComponent(JSON.stringify([["payment_request", "=", paymentRequestFilter]]))}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return NextResponse.json(
        { message: parseError(response, errorText) },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ data: data.data || [] });
  } catch (error) {
    console.error("ERPNext payment transaction log list error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
