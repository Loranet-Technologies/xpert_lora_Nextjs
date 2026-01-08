import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

// GET - Get subscription device by device ID
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
    const deviceId = searchParams.get("device");
    const status = searchParams.get("status");

    if (!deviceId) {
      return NextResponse.json(
        { message: "Device ID is required" },
        { status: 400 }
      );
    }

    // Build filters for ERPNext resource API
    // Format: [["field", "operator", "value"]]
    const filters: any[] = [["device", "=", deviceId]];
    if (status) {
      filters.push(["status", "=", status]);
    }

    const filtersStr = JSON.stringify(filters);
    const fields = '["name", "subscription", "device", "start_date", "end_date", "status"]';

    const resourceUrl = `${ERPNEXT_API_URLS.SUBSCRIPTION_DEVICE_RESOURCE}?fields=${encodeURIComponent(
      fields
    )}&filters=${encodeURIComponent(filtersStr)}&limit_page_length=1`;

    const response = await fetch(resourceUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      // If not found (404), return empty data
      if (response.status === 404) {
        return NextResponse.json({ data: null });
      }
      const errorText = await response.text().catch(() => "");
      let errorData: any = { message: "Failed to get subscription device" };

      try {
        errorData = JSON.parse(errorText);
        if (errorData.message && typeof errorData.message === "object") {
          errorData.message =
            errorData.message.exc_message ||
            errorData.message.message ||
            JSON.stringify(errorData.message);
        }
      } catch {
        errorData = { message: errorText || "Failed to get subscription device" };
      }

      return NextResponse.json(
        { message: errorData.message || "Failed to get subscription device" },
        { status: response.status }
      );
    }

    const data = await response.json();
    // Return first result if exists, otherwise null
    return NextResponse.json({
      data: data.data && data.data.length > 0 ? data.data[0] : null,
    });
  } catch (error) {
    console.error("ERPNext subscription device query error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
