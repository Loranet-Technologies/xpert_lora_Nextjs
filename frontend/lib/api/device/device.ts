import { getERPNextToken } from "../utils/token";

// ERPNext Device API - List devices from ERPNext (similar to listERPNextGateways)
export async function listERPNextDevices(params?: {
  filters?: string | Record<string, any>;
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
    const queryParams = new URLSearchParams();
    if (params?.limit) {
      queryParams.append("limit", params.limit.toString());
    }
    if (params?.offset) {
      queryParams.append("offset", params.offset.toString());
    }
    if (params?.filters) {
      const filtersStr =
        typeof params.filters === "string"
          ? params.filters
          : JSON.stringify(params.filters);
      queryParams.append("filters", filtersStr);
    }

    // Use fetch directly to include ERPNext token in Authorization header
    const response = await fetch(
      `/api/erpnext/device?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to list devices",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to list ERPNext devices:", error);
    throw error;
  }
}

// ERPNext Device API - Fetch devices from ERPNext
export async function fetchERPNextDevices(params?: {
  fields?: string[];
  filters?: string;
  application?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    // Use Next.js API route as proxy to avoid CORS issues
    const fields = params?.fields || ["*"];
    const fieldsParam = JSON.stringify(fields);
    const limit = params?.limit || 20;
    const offset = params?.offset || 0;

    // Get ERPNext token (with automatic fallback to Keycloak token)
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    // Build query parameters
    let queryParams = `fields=${encodeURIComponent(
      fieldsParam
    )}&limit=${limit}&offset=${offset}`;
    if (params?.application) {
      // Filter by application if provided
      const filters = JSON.stringify([
        ["application", "=", params.application],
      ]);
      queryParams += `&filters=${encodeURIComponent(filters)}`;
    } else if (params?.filters) {
      queryParams += `&filters=${encodeURIComponent(params.filters)}`;
    }

    // Use fetch directly to include ERPNext token in Authorization header
    const response = await fetch(`/api/erpnext/device?${queryParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to fetch devices",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch ERPNext devices:", error);
    throw error;
  }
}

// ERPNext Device API - Get a single device by ID
export async function getERPNextDevice(deviceId: string) {
  try {
    // Get ERPNext token (with automatic fallback to Keycloak token)
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    const response = await fetch(`/api/erpnext/device/${deviceId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to fetch device",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get ERPNext device:", error);
    throw error;
  }
}

// ERPNext Device API - Create a new device
export async function createERPNextDevice(data: {
  device_name: string;
  dev_eui: string;
  application: string;
  device_profile: string;
  status?: string;
  description?: string;
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

    const response = await fetch("/api/erpnext/device", {
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
      let errorData: any = { message: "Failed to create device" };

      try {
        errorData = await response.json();
      } catch {
        errorData = { message: errorText || "Failed to create device" };
      }

      const errorMessage =
        errorData.message ||
        errorData.exc_message ||
        `HTTP ${response.status}: ${errorText}`;

      console.error("Device creation error:", {
        status: response.status,
        errorMessage,
        errorData,
      });

      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to create ERPNext device:", error);
    throw error;
  }
}

// ERPNext Device API - Update a device
export async function updateERPNextDevice(
  deviceId: string,
  data: {
    device_name?: string;
    dev_eui?: string;
    application?: string;
    device_profile?: string;
    status?: string;
    description?: string;
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

    const response = await fetch(`/api/erpnext/device/${deviceId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to update device",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to update ERPNext device:", error);
    throw error;
  }
}

// ERPNext Device API - Delete a device
export async function deleteERPNextDevice(deviceId: string) {
  try {
    // Get ERPNext token (with automatic fallback to Keycloak token)
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    const response = await fetch(`/api/erpnext/device/${deviceId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to delete device",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to delete ERPNext device:", error);
    throw error;
  }
}

