import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

export async function POST(request: NextRequest) {
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

    // Forward the logout request to ERPNext with token
    await fetch(ERPNEXT_API_URLS.FRAPPE_LOGOUT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Cookie: `sid=${token}`, // Also send as cookie for ERPNext compatibility
      },
    });

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ERPNext logout proxy error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
