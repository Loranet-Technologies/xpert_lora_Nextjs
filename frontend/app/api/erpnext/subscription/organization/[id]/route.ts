import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

// GET - Get all subscriptions for an organization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || null;

    if (!token) {
      return NextResponse.json(
        { message: "Authorization token required" },
        { status: 401 }
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

    const { id } = await params;
    const organizationId = id;

    if (!organizationId) {
      return NextResponse.json(
        { message: "Organization ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${ERPNEXT_API_URLS.GET_ORGANIZATION_SUBSCRIPTIONS}?organization_id=${organizationId}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: any = {
        message: "Failed to get organization subscriptions",
      };

      try {
        errorData = JSON.parse(errorText);
        if (errorData.message && typeof errorData.message === "object") {
          errorData.message =
            errorData.message.exc_message ||
            errorData.message.message ||
            JSON.stringify(errorData.message);
        }
      } catch {
        errorData = {
          message: errorText || "Failed to get organization subscriptions",
        };
      }

      return NextResponse.json(
        {
          message:
            errorData.message || "Failed to get organization subscriptions",
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data.message || data);
  } catch (error) {
    console.error("ERPNext organization subscriptions GET error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
