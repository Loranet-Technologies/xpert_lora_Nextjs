import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

/**
 * GET - Get all organizations for the current user in one call.
 * Proxies to xpert_lora_app.api.get_organizations_by_user.
 * Returns: { success, data: [...], total }
 */
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

    const response = await fetch(ERPNEXT_API_URLS.GET_ORGANIZATIONS_BY_USER, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const errorData: { message?: string } = {
        message: "Failed to get organizations",
      };
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.message && typeof parsed.message === "object") {
          errorData.message =
            parsed.message.exc_message ||
            parsed.message.message ||
            JSON.stringify(parsed.message);
        } else if (parsed.message) {
          errorData.message = parsed.message;
        }
      } catch {
        errorData.message = errorText || errorData.message;
      }
      return NextResponse.json(
        { message: errorData.message || "Failed to get organizations" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: data.success !== false,
      data: data.data || [],
      total: data.total ?? (data.data?.length ?? 0),
    });
  } catch (error) {
    console.error("ERPNext get organizations by user error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
