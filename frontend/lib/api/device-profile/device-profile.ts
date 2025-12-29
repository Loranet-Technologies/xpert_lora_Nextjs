import { getERPNextToken } from "../utils/token";

// ERPNext Device Profile API - Fetch device profiles from ERPNext
export async function fetchERPNextDeviceProfiles(params?: {
  fields?: string[];
  filters?: string;
  tenant?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    // Get ERPNext token (with automatic fallback to Keycloak token)
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    // Build query parameters
    const limit = params?.limit || 20;
    const offset = params?.offset || 0;
    let queryParams = `limit=${limit}&offset=${offset}`;

    if (params?.tenant) {
      // Filter by tenant if provided
      const filterArray = [["tenant", "=", params.tenant]];
      const filters = JSON.stringify(filterArray);
      queryParams += `&filters=${encodeURIComponent(filters)}`;
    } else if (params?.filters) {
      queryParams += `&filters=${encodeURIComponent(params.filters)}`;
    }

    // Use fetch directly to include ERPNext token in Authorization header
    const response = await fetch(`/api/erpnext/device-profile?${queryParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to fetch device profiles",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch ERPNext device profiles:", error);
    throw error;
  }
}

// ERPNext Device Profile API - Create a new device profile
export async function createERPNextDeviceProfile(data: {
  profile_name: string;
  tenant: string;
  region?: string;
  small_text?: string;
  mac_version?: string;
  regional_parameters_revision?: string;
  supports_otaa_join?: number;
  supports_32_bit_frame_counter?: number;
  metadata?: any;
}) {
  try {
    // Get ERPNext token (with automatic fallback to Keycloak token)
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    const response = await fetch("/api/erpnext/device-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: any = { message: "Failed to create device profile" };

      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || "Failed to create device profile" };
      }

      // Extract the actual error message
      const errorMessage =
        errorData.message ||
        errorData.exc_message ||
        `HTTP error! status: ${response.status}`;

      console.error("Device profile creation error:", {
        status: response.status,
        errorData,
        errorText,
      });

      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to create ERPNext device profile:", error);
    throw error;
  }
}

// ERPNext Device Profile API - Update a device profile
export async function updateERPNextDeviceProfile(
  deviceProfileId: string,
  data: {
    profile_name?: string;
    tenant?: string;
    region?: string;
    small_text?: string;
    mac_version?: string;
    regional_parameters_revision?: string;
    supports_otaa_join?: number;
    supports_32_bit_frame_counter?: number;
    metadata?: any;
  }
) {
  try {
    // Get ERPNext token (with automatic fallback to Keycloak token)
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    const response = await fetch(
      `/api/erpnext/device-profile/${deviceProfileId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to update device profile",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to update ERPNext device profile:", error);
    throw error;
  }
}

// ERPNext Device Profile API - Delete a device profile
export async function deleteERPNextDeviceProfile(deviceProfileId: string) {
  try {
    // Get ERPNext token (with automatic fallback to Keycloak token)
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    const response = await fetch(
      `/api/erpnext/device-profile/${deviceProfileId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to delete device profile",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to delete ERPNext device profile:", error);
    throw error;
  }
}

