import { getERPNextToken } from "../utils/token";

// ERPNext Gateway API - Fetch gateways from ERPNext
export async function fetchERPNextGateways(params?: {
  fields?: string[];
  filters?: string;
  tenant?: string;
}) {
  try {
    // Use Next.js API route as proxy to avoid CORS issues
    const fields = params?.fields || ["*"];
    const fieldsParam = JSON.stringify(fields);

    // Get ERPNext token (with automatic fallback to Keycloak token)
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    // Build query parameters
    let queryParams = `fields=${encodeURIComponent(fieldsParam)}`;
    if (params?.tenant) {
      // Filter by tenant if provided
      const filters = JSON.stringify([["tenant", "=", params.tenant]]);
      queryParams += `&filters=${encodeURIComponent(filters)}`;
    } else if (params?.filters) {
      queryParams += `&filters=${encodeURIComponent(params.filters)}`;
    }

    // Use fetch directly to include ERPNext token in Authorization header
    const response = await fetch(`/api/erpnext/gateway?${queryParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to fetch gateways",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch ERPNext gateways:", error);
    throw error;
  }
}

// ERPNext Gateway API - List gateways with filters and pagination
export async function listERPNextGateways(params?: {
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
      `/api/erpnext/gateway?${queryParams.toString()}`,
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
        message: "Failed to list gateways",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to list ERPNext gateways:", error);
    throw error;
  }
}

// ERPNext Gateway API - Get a single gateway by ID
export async function getERPNextGateway(gatewayId: string) {
  try {
    // Get ERPNext token (with automatic fallback to Keycloak token)
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    const response = await fetch(`/api/erpnext/gateway/${gatewayId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to fetch gateway",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get ERPNext gateway:", error);
    throw error;
  }
}

// ERPNext Gateway API - Sync gateways from ChirpStack
export async function syncERPNextGateways(tenantId: string) {
  try {
    // Get ERPNext token (with automatic fallback to Keycloak token)
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    const response = await fetch(`/api/erpnext/gateway/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tenant_id: tenantId,
      }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to sync gateways",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to sync ERPNext gateways:", error);
    throw error;
  }
}

