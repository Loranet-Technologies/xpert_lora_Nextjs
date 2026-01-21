import { NextRequest, NextResponse } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keycloakToken } = body;

    if (!keycloakToken) {
      return NextResponse.json(
        { message: "Keycloak token is required" },
        { status: 400 }
      );
    }

    // Call the SSO login endpoint which accepts Keycloak tokens
    // The backend endpoint: /api/method/xpert_lora_app.api.sso_login
    // Accepts token in Authorization header or as access_token parameter
    const response = await fetch(ERPNEXT_API_URLS.SSO_LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${keycloakToken}`,
        },
        body: JSON.stringify({ access_token: keycloakToken }),
      }
    ).catch((error) => {
      console.error("SSO login request failed:", error);
      return null;
    });

    // Extract token from response if we got a successful response
    let token = null;
    let responseData: any = null;
    let apiKey = null;
    let apiSecret = null;

    if (response && response.ok) {
      responseData = await response.json();

      // The backend returns: { message: { token: "Token api_key:api_secret", api_key, api_secret, ... } }
      if (responseData.message) {
        // Extract the token (format: "Token api_key:api_secret")
        if (responseData.message.token) {
          token = responseData.message.token;
          apiKey = responseData.message.api_key;
          apiSecret = responseData.message.api_secret;
        } else if (responseData.message.sid) {
          // Fallback to session ID if available
          token = responseData.message.sid;
        }
      } else if (responseData.token) {
        token = responseData.token;
      }

      // Also check for session ID in cookies
      if (!token) {
        const setCookieHeaders = response.headers.getSetCookie();
        if (setCookieHeaders && setCookieHeaders.length > 0) {
          for (const cookie of setCookieHeaders) {
            if (cookie.startsWith("sid=")) {
              const match = cookie.match(/sid=([^;]+)/);
              if (match && match[1]) {
                token = match[1];
                break;
              }
            }
          }
        }
      }

      if (token) {
        console.log("✅ Successfully obtained ERPNext session token");
        return NextResponse.json({
          ...responseData,
          token: token,
          api_key: apiKey,
          api_secret: apiSecret,
          message: responseData.message || "SSO Authentication Successful!",
        });
      }
    } else {
      // Log error details for debugging
      if (response) {
        const errorText = await response.text().catch(() => "");
        console.error(
          `SSO login failed with status ${response.status}:`,
          errorText
        );
      }
    }

    // If we don't have a token, the authentication failed
    // Return error instead of falling back to Keycloak token
    // The auth hook should handle Keycloak tokens directly for API calls
    return NextResponse.json(
      {
        message: "Failed to authenticate with ERPNext using Keycloak token",
        error: responseData?.message || "Authentication failed",
        // Still return the Keycloak token so the auth hook can try to use it
        keycloakToken: keycloakToken,
      },
      { status: response?.status || 401 }
    );
  } catch (error) {
    console.error("ERPNext Keycloak login proxy error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
