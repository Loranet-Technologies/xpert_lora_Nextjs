import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";
import { parseErpNextError } from "@/lib/api/utils/parseErpNextError";
import { erpnextForwardHeaders } from "@/lib/api/utils/erpnextForwardAuth";

function unwrapFrappePayload(data: unknown): unknown {
  if (data && typeof data === "object" && "message" in data) {
    return (data as { message: unknown }).message;
  }
  return data;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "")?.trim() || null;
    if (!token) {
      return NextResponse.json(
        { message: "Authorization token required" },
        { status: 401 },
      );
    }

    const name = request.nextUrl.searchParams.get("name");
    const dashboardName = request.nextUrl.searchParams.get("dashboard_name");
    const url = new URL(ERPNEXT_API_URLS.CUSTOM_DASHBOARD_GET);
    if (name) url.searchParams.set("name", name);
    if (dashboardName) url.searchParams.set("dashboard_name", dashboardName);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: erpnextForwardHeaders(token),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const errorMessage = parseErpNextError(
        errorText,
        "Failed to load dashboard",
      );
      return NextResponse.json(
        { success: false, message: errorMessage, error: errorMessage },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(unwrapFrappePayload(data));
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "")?.trim() || null;
    if (!token) {
      return NextResponse.json(
        { message: "Authorization token required" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));

    const response = await fetch(ERPNEXT_API_URLS.CUSTOM_DASHBOARD_GET, {
      method: "POST",
      headers: erpnextForwardHeaders(token),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const errorMessage = parseErpNextError(
        errorText,
        "Failed to load dashboard",
      );
      return NextResponse.json(
        { success: false, message: errorMessage, error: errorMessage },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(unwrapFrappePayload(data));
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
