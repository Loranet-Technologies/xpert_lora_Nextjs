import { NextRequest, NextResponse } from "next/server";

const ERPNext_BASE_URL =
  process.env.NEXT_PUBLIC_ERPNEXT_URL || "https://erp.xperts.loranet.my";

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
    await fetch(`${ERPNext_BASE_URL}/api/method/frappe.auth.logout`, {
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
