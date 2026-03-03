import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

/**
 * POST - Get all subscriptions for multiple organizations in one call.
 * Body: { organizations: string[] } (e.g. ["ORG-001", "ORG-002"]).
 * Proxies to xpert_lora_app.api.get_subscriptions_by_organizations.
 * Returns: { success, organizations: [{ name, organization_name, subscriptions: [...] }] }
 */
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
    let organizations = body.organizations;
    if (!organizations) {
      return NextResponse.json(
        { message: "organizations array is required" },
        { status: 400 },
      );
    }
    if (!Array.isArray(organizations)) {
      organizations = [organizations].filter(Boolean);
    }
    const orgNames = [...new Set(organizations)].filter(
      (o): o is string => typeof o === "string" && o.length > 0,
    );

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

    const response = await fetch(
      ERPNEXT_API_URLS.GET_SUBSCRIPTIONS_BY_ORGANIZATIONS,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ organizations: orgNames }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const errorData: { message?: string } = {
        message: "Failed to get subscriptions by organizations",
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
        {
          message:
            errorData.message || "Failed to get subscriptions by organizations",
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: data.success !== false,
      organizations: data.organizations || [],
    });
  } catch (error) {
    console.error("ERPNext get subscriptions by organizations error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
