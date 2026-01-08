import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

// GET - Get all organizations
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const fields =
      searchParams.get("fields") || '["name", "organization_name"]';

    // Query ERPNext resource API
    const resourceUrl = `${
      ERPNEXT_API_URLS.ORGANIZATION_RESOURCE
    }?fields=${encodeURIComponent(
      fields
    )}&limit_page_length=${limit}&limit_start=${offset}`;

    const response = await fetch(resourceUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: any = { message: "Failed to get organizations" };

      try {
        errorData = JSON.parse(errorText);
        if (errorData.message && typeof errorData.message === "object") {
          errorData.message =
            errorData.message.exc_message ||
            errorData.message.message ||
            JSON.stringify(errorData.message);
        }
      } catch {
        errorData = { message: errorText || "Failed to get organizations" };
      }

      return NextResponse.json(
        { message: errorData.message || "Failed to get organizations" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ data: data.data || [] });
  } catch (error) {
    console.error("ERPNext get organizations error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new organization
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

    // Forward the request to ERPNext resource API
    const response = await fetch(ERPNEXT_API_URLS.ORGANIZATION_RESOURCE, {
      method: "POST",
      headers,
      body: JSON.stringify({
        data: body,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: any = { message: "Failed to create organization" };

      try {
        errorData = JSON.parse(errorText);
        if (errorData.message && typeof errorData.message === "object") {
          errorData.message =
            errorData.message.exc_message ||
            errorData.message.message ||
            JSON.stringify(errorData.message);
        }
      } catch {
        errorData = { message: errorText || "Failed to create organization" };
      }

      const errorMessage =
        errorData.message ||
        errorData.exc_message ||
        `HTTP ${response.status}: ${errorText}`;

      console.error("Organization creation error:", {
        status: response.status,
        errorMessage,
        errorData,
        errorText,
      });

      return NextResponse.json(
        { message: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    // ERPNext resource API returns { data: {...} }
    const result = data.data || data;

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("ERPNext organization CREATE error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
