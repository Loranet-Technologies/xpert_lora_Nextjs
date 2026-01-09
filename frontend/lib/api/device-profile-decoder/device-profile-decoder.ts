import { ERPNEXT_API_URLS } from "@/lib/config/api.config";

// Device Profile Decoder type
export type DeviceProfileDecoder = {
  name: string;
  device_profile_decoder_name: string;
  decoder: string;
};

/**
 * Fetch device profile decoders from public GitHub repositories.
 * This is a public endpoint (no authentication required).
 *
 * The API returns a response with structure:
 * {
 *   "success": true,
 *   "data": [...],
 *   "total": number
 * }
 */
export async function fetchDeviceProfileDecoders(): Promise<
  DeviceProfileDecoder[]
> {
  try {
    const response = await fetch(ERPNEXT_API_URLS.GET_DEVICE_PROFILE_DECODERS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to fetch device profile decoders",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const responseData = await response.json();
    // Frappe API returns data in message field
    const apiResponse = responseData.message || responseData;

    // Handle the new response structure with success, data, and total fields
    if (apiResponse.success === false) {
      const errorMessage =
        apiResponse.error || "Failed to fetch device profile decoders";
      throw new Error(errorMessage);
    }

    // Extract the data array from the response
    // Support both new structure (with data field) and legacy structure (direct array)
    if (Array.isArray(apiResponse)) {
      return apiResponse;
    }

    if (apiResponse.data && Array.isArray(apiResponse.data)) {
      return apiResponse.data;
    }

    // Fallback: return empty array if structure is unexpected
    console.warn("Unexpected API response structure:", apiResponse);
    return [];
  } catch (error) {
    console.error("Failed to fetch device profile decoders:", error);
    throw error;
  }
}
