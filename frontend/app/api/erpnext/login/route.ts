import { NextRequest, NextResponse } from "next/server";

const ERPNext_BASE_URL =
  process.env.NEXT_PUBLIC_ERPNEXT_URL || "https://erp.xperts.loranet.my";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { usr, pwd } = body;

    if (!usr || !pwd) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    // Forward the request to ERPNext
    const response = await fetch(
      `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usr, pwd }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Login failed" },
        { status: response.status }
      );
    }

    // Extract token from response
    // ERPNext typically uses session cookies (sid), so we extract from Set-Cookie headers first
    let token = null;
    
    // First, try to extract session ID from Set-Cookie headers (most reliable for ERPNext)
    const setCookieHeaders = response.headers.getSetCookie();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      for (const cookie of setCookieHeaders) {
        // Extract sid cookie (ERPNext session ID)
        if (cookie.startsWith('sid=')) {
          const match = cookie.match(/sid=([^;]+)/);
          if (match && match[1]) {
            token = match[1];
            break;
          }
        }
      }
    }

    // If no token from cookies, check response data
    if (!token) {
      if (data.message) {
        if (typeof data.message === 'string' && data.message.length > 20) {
          // Likely a token if it's a long string
          token = data.message;
        } else if (data.message.token) {
          token = data.message.token;
        }
      } else if (data.token) {
        token = data.token;
      }
    }

    // Return response with token
    return NextResponse.json({
      ...data,
      token: token, // Include token in response (session ID from cookies or response)
    });
  } catch (error) {
    console.error("ERPNext login proxy error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

