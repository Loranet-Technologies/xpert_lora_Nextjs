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

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      Cookie: `sid=${token}`, // Also send as cookie for ERPNext compatibility
    };

    // Prefer custom app logout endpoint so server-side audit logging can run.
    let response = await fetch(ERPNEXT_API_URLS.LOGOUT, {
      method: "POST",
      headers,
    });

    // Fallback to frappe logout for compatibility.
    if (!response.ok) {
      response = await fetch(ERPNEXT_API_URLS.FRAPPE_LOGOUT, {
        method: "POST",
        headers,
      });
    }

    // Return success response
    if (response.ok) {
      return NextResponse.json({ success: true });
    }

    const text = await response.text().catch(() => "");
    return NextResponse.json(
      {
        success: false,
        message: text || "Logout failed",
      },
      { status: response.status || 500 }
    );
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
