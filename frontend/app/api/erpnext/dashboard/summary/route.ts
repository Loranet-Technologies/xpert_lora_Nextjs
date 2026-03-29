import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";
import { parseErpNextError } from "@/lib/api/utils/parseErpNextError";

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

    const organization = request.nextUrl.searchParams.get("organization");

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

    const url = new URL(ERPNEXT_API_URLS.GET_DASHBOARD_SUMMARY);
    if (organization) {
      url.searchParams.set("organization", organization);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const errorMessage = parseErpNextError(
        errorText,
        "Failed to get dashboard summary",
      );
      return NextResponse.json(
        { success: false, message: errorMessage, error: errorMessage },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data.message || data);
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
