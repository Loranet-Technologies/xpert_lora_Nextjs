import { NextRequest, NextResponse } from "next/server";

const ERPNext_BASE_URL =
  process.env.NEXT_PUBLIC_ERPNEXT_URL || "https://erp.xperts.loranet.my";

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || null;

    if (!token) {
      return NextResponse.json(
        { message: "Authorization token required" },
        { status: 401 }
      );
    }

    // Get query parameters from the request
    const { searchParams } = new URL(request.url);
    const fields = searchParams.get("fields") || '["*"]';
    const filters = searchParams.get("filters");

    // Build the URL with query parameters
    let url = `${ERPNext_BASE_URL}/api/resource/Device?fields=${encodeURIComponent(fields)}`;
    if (filters) {
      url += `&filters=${encodeURIComponent(filters)}`;
    }

    // Forward the request to ERPNext with token in Authorization header
    // ERPNext can accept token in Authorization header or Cookie
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Cookie: `sid=${token}`, // Also send as cookie for ERPNext compatibility
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to fetch devices",
      }));
      return NextResponse.json(
        { message: errorData.message || "Failed to fetch devices" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("ERPNext device proxy error:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

