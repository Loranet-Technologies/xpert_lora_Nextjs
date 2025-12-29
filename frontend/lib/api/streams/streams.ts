import { getERPNextToken } from "../utils/token";

// Gateway Frames SSE Stream using fetch (supports auth headers)
export async function streamGatewayFrames(
  gatewayEui: string,
  onMessage: (frame: any) => void,
  onError?: (error: Error) => void
): Promise<() => void> {
  try {
    // Get ERPNext token
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    // Use Next.js API route as proxy to avoid CORS issues
    const url = `/api/erpnext/gateway-frames?gateway_eui=${encodeURIComponent(
      gatewayEui
    )}`;

    // Use fetch with streaming
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`,
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let isStreaming = true;

    // Read stream
    const readStream = async () => {
      try {
        while (isStreaming) {
          const { done, value } = await reader.read();

          if (done) {
            isStreaming = false;
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = line.slice(6); // Remove "data: " prefix
                if (data.trim()) {
                  const frame = JSON.parse(data);
                  onMessage(frame);
                }
              } catch (parseError) {
                console.error("Failed to parse frame data:", parseError);
              }
            }
          }
        }
      } catch (streamError) {
        isStreaming = false;
        if (onError) {
          onError(
            streamError instanceof Error
              ? streamError
              : new Error(String(streamError))
          );
        }
      }
    };

    // Start reading
    readStream();

    // Return cleanup function
    return () => {
      isStreaming = false;
      reader.cancel().catch((err) => {
        console.error("Error canceling stream:", err);
      });
    };
  } catch (error) {
    console.error("Failed to stream gateway frames:", error);
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
    throw error;
  }
}

// Device Events SSE Stream using fetch (supports auth headers)
export async function streamDeviceEvents(
  deviceEui: string,
  onMessage: (event: any) => void,
  onError?: (error: Error) => void
): Promise<() => void> {
  try {
    // Get ERPNext token
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    // Use Next.js API route as proxy to avoid CORS issues
    const url = `/api/erpnext/device-events?device_eui=${encodeURIComponent(
      deviceEui
    )}`;

    // Use fetch with streaming
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`,
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let isStreaming = true;

    // Read stream
    const readStream = async () => {
      try {
        while (isStreaming) {
          const { done, value } = await reader.read();

          if (done) {
            isStreaming = false;
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = line.slice(6); // Remove "data: " prefix
                if (data.trim()) {
                  const event = JSON.parse(data);
                  onMessage(event);
                }
              } catch (parseError) {
                console.error("Failed to parse event data:", parseError);
              }
            }
          }
        }
      } catch (streamError) {
        isStreaming = false;
        if (onError) {
          onError(
            streamError instanceof Error
              ? streamError
              : new Error(String(streamError))
          );
        }
      }
    };

    // Start reading
    readStream();

    // Return cleanup function
    return () => {
      isStreaming = false;
      reader.cancel().catch((err) => {
        console.error("Error canceling stream:", err);
      });
    };
  } catch (error) {
    console.error("Failed to stream device events:", error);
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
    throw error;
  }
}

