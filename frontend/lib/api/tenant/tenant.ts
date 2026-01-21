import { getERPNextToken } from "../utils/token";

// ERPNext Tenant API - List tenants from ERPNext
export async function fetchERPNextTenants(params?: {
  limit?: number;
  offset?: number;
  filters?: string;
  fields?: string | string[];
}) {
  try {
    // Use Next.js API route as proxy to avoid CORS issues
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
    let queryParams = `limit=${limit}&offset=${offset}`;
    if (params?.filters) {
      queryParams += `&filters=${encodeURIComponent(params.filters)}`;
    }
    if (params?.fields) {
      const fieldsStr = Array.isArray(params.fields)
        ? JSON.stringify(params.fields)
        : params.fields;
      queryParams += `&fields=${encodeURIComponent(fieldsStr)}`;
    }

    // Use fetch directly to include ERPNext token in Authorization header
    const response = await fetch(`/api/erpnext/tenant?${queryParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to fetch tenants",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch ERPNext tenants:", error);
    throw error;
  }
}

// ERPNext Tenant API - Create a new tenant
export async function createERPNextTenant(data: {
  tenant_name: string;
  description?: string;
  can_have_gateways?: number;
  max_gateway_count?: number;
  max_device_count?: number;
}) {
  try {
    // Get ERPNext token (with automatic fallback to Keycloak token)
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    const response = await fetch("/api/erpnext/tenant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to create tenant",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to create ERPNext tenant:", error);
    throw error;
  }
}

// ERPNext Tenant API - Update a tenant
export async function updateERPNextTenant(
  tenantId: string,
  data: {
    tenant_name?: string;
    description?: string;
    can_have_gateways?: number;
    max_gateway_count?: number;
    max_device_count?: number;
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

    const response = await fetch(`/api/erpnext/tenant/${tenantId}`, {
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
        message: "Failed to update tenant",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to update ERPNext tenant:", error);
    throw error;
  }
}

// ERPNext Tenant API - Delete a tenant
export async function deleteERPNextTenant(tenantId: string) {
  try {
    // Get ERPNext token (with automatic fallback to Keycloak token)
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    const response = await fetch(`/api/erpnext/tenant/${tenantId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to delete tenant",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to delete ERPNext tenant:", error);
    throw error;
  }
}

