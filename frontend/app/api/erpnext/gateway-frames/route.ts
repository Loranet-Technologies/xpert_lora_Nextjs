import { NextRequest } from "next/server";
import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || null;

    if (!token) {
      return new Response(
        JSON.stringify({ message: "Authorization token required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const gatewayEui = searchParams.get("gateway_eui");

    if (!gatewayEui) {
      return new Response(
        JSON.stringify({ message: "gateway_eui parameter is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Build the ERPNext API URL
    const url = `${ERPNEXT_API_URLS.GATEWAY_FRAMES}?gateway_eui=${encodeURIComponent(
      gatewayEui
    )}`;

    // Determine token type and format headers accordingly
    const headers: HeadersInit = {
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
    };

    if (token.startsWith("Token ")) {
      // ERPNext API token format
      headers["Authorization"] = token;
    } else if (token.includes(":")) {
      // Might be an API token without "Token " prefix, or Keycloak token
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      // Likely a session ID
      headers["Cookie"] = `sid=${token}`;
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Forward the request to ERPNext and stream the response
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return new Response(
        JSON.stringify({
          message: errorText || "Failed to stream gateway frames",
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if response is a stream
    if (!response.body) {
      return new Response(
        JSON.stringify({ message: "Response body is null" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create a readable stream to forward the SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              try {
                controller.close();
              } catch {
                // Controller might already be closed, ignore
              }
              break;
            }
            try {
              controller.enqueue(value);
            } catch {
              // Controller might be closed by client, stop reading
              reader.cancel().catch(() => {});
              break;
            }
          }
        } catch (error) {
          console.error("Error streaming gateway frames:", error);
          try {
            controller.error(error);
          } catch {
            // Controller might already be closed, ignore
          }
        } finally {
          // Ensure reader is released
          try {
            reader.releaseLock();
          } catch {
            // Reader might already be released, ignore
          }
        }
      },
    });

    // Return the stream with appropriate headers for SSE
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("ERPNext gateway frames proxy error:", error);
    return new Response(
      JSON.stringify({
        message:
          error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
