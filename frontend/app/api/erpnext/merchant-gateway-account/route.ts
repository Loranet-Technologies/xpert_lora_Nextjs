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

// GET - List merchant gateway accounts
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
    const limit = searchParams.get("limit") || "100";
    const offset = searchParams.get("offset") || "0";
    const merchantFilter = searchParams.get("merchant");
    const fields =
      searchParams.get("fields") ||
      '["name","merchant_id","account_name","merchant","api_key","environment","is_default","currency","is_active","payment_gateway","webhook_secret"]';

    let url = `${ERPNEXT_API_URLS.MERCHANT_GATEWAY_ACCOUNT_RESOURCE}?fields=${encodeURIComponent(fields)}&limit_page_length=${limit}&limit_start=${offset}`;
    if (merchantFilter) {
      url += `&filters=${encodeURIComponent(JSON.stringify([["merchant", "=", merchantFilter]]))}`;
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
    console.error("ERPNext merchant gateway account list error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// POST - Create merchant gateway account
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
    const response = await fetch(
      ERPNEXT_API_URLS.MERCHANT_GATEWAY_ACCOUNT_RESOURCE,
      {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ data: body }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return NextResponse.json(
        { message: parseError(response, errorText) },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data: data.data || data,
    });
  } catch (error) {
    console.error("ERPNext merchant gateway account create error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
