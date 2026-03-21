import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";
import { parseErpNextError } from "@/lib/api/utils/parseErpNextError";

function buildAuthHeaders(token: string): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token.startsWith("Token ")) {
    headers.Authorization = token;
  } else if (token.includes(":")) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    headers.Cookie = `sid=${token}`;
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/** GET — list User Activity Log rows from ERPNext (see list_user_activity_logs in api.py). */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "").trim() || null;

    if (!token) {
      return NextResponse.json(
        { message: "Authorization token required" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "1";
    const limit =
      searchParams.get("limit") || searchParams.get("page_length") || "25";
    const user = searchParams.get("user") || "";
    const action = searchParams.get("action") || "";
    const status = searchParams.get("status") || "";
    const from_date = searchParams.get("from") || searchParams.get("from_date") || "";
    const to_date = searchParams.get("to") || searchParams.get("to_date") || "";

    let queryString = `page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`;
    if (user) queryString += `&user=${encodeURIComponent(user)}`;
    if (action) queryString += `&action=${encodeURIComponent(action)}`;
    if (status) queryString += `&status=${encodeURIComponent(status)}`;
    if (from_date) queryString += `&from_date=${encodeURIComponent(from_date)}`;
    if (to_date) queryString += `&to_date=${encodeURIComponent(to_date)}`;

    const headers = buildAuthHeaders(token);

    let response = await fetch(
      `${ERPNEXT_API_URLS.LIST_USER_ACTIVITY_LOGS}?${queryString}`,
      { method: "GET", headers }
    );

    if (!response.ok) {
      const requestBody: Record<string, string | number> = {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 25,
      };
      if (user) requestBody.user = user;
      if (action) requestBody.action = action;
      if (status) requestBody.status = status;
      if (from_date) requestBody.from_date = from_date;
      if (to_date) requestBody.to_date = to_date;

      response = await fetch(ERPNEXT_API_URLS.LIST_USER_ACTIVITY_LOGS, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const errorMessage = parseErpNextError(
        errorText,
        "Failed to list user activity logs"
      );
      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          error: errorMessage,
          data: [],
          total: 0,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const result = data.message ?? data;

    if (result && typeof result === "object" && "success" in result) {
      return NextResponse.json(result);
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("ERPNext user-activity-log proxy error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
