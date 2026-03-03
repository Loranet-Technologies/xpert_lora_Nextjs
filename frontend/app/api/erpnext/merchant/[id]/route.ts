import { NextRequest, NextResponse } from "next/server";
import { getErpNextUrl } from "@/lib/config/api.config";

function getAuthHeaders(token: string | null): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (!token) return headers;
  if (token.startsWith("Token ")) headers["Authorization"] = token;
  else if (token.includes(":")) headers["Authorization"] = `Bearer ${token}`;
  else {
    headers["Cookie"] = `sid=${token}`;
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function parseError(response: Response, errorText: string) {
  let errorData: { message?: string | object } = { message: "Request failed" };
  try {
    errorData = JSON.parse(errorText);
    if (errorData.message && typeof errorData.message === "object") {
      errorData.message =
        (errorData.message as { exc_message?: string }).exc_message ||
        (errorData.message as { message?: string }).message ||
        JSON.stringify(errorData.message);
    }
  } catch {
    errorData = { message: errorText || "Request failed" };
  }
  return typeof errorData.message === "string"
    ? errorData.message
    : "Request failed";
}

// GET - Get one merchant
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

    const { id } = await params;
    const url = getErpNextUrl.MERCHANT_BY_ID(id);
    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return NextResponse.json(
        { message: parseError(response, errorText) },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data.data || data);
  } catch (error) {
    console.error("ERPNext merchant get error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// PUT - Update merchant
export async function PUT(
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

    const { id } = await params;
    const body = await request.json();
    const url = getErpNextUrl.MERCHANT_BY_ID(id);
    const response = await fetch(url, {
      method: "PUT",
      headers: getAuthHeaders(token),
      body: JSON.stringify({ data: body }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return NextResponse.json(
        { message: parseError(response, errorText) },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data: data.data || data });
  } catch (error) {
    console.error("ERPNext merchant update error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete merchant
export async function DELETE(
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

    const { id } = await params;
    const url = getErpNextUrl.MERCHANT_BY_ID(id);
    const response = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return NextResponse.json(
        { message: parseError(response, errorText) },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ERPNext merchant delete error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
