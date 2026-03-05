/**
 * POST - Public user registration (no auth required).
 * Proxies to ERPNext create_user. Backend must have allow_guest on create_user.
 */
import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";
import { parseErpNextError } from "@/lib/api/utils/parseErpNextError";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Backend expects full_name, email, password (derives first_name/last_name, role, etc.)
    const payload = {
      full_name: (body.full_name || body.fullName || "").trim(),
      email: (body.email || "").trim().toLowerCase(),
      password: body.password,
    };

    if (!payload.full_name || !payload.email || !payload.password) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation Error",
          error: "Full name, email, and password are required",
        },
        { status: 400 }
      );
    }

    const response = await fetch(ERPNEXT_API_URLS.CREATE_USER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const errorMessage = parseErpNextError(
        errorText,
        "Failed to create user"
      );

      return NextResponse.json(
        { success: false, message: errorMessage, error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    const result = data.message || data;

    if (result && typeof result === "object" && result.success === false) {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "Error",
          error: result.error || result.message || "An error occurred",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("ERPNext register user proxy error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
