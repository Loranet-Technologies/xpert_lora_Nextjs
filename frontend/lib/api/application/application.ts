import { getERPNextToken } from "../utils/token";

// ERPNext Application API - Fetch applications from ERPNext
export async function fetchERPNextApplications(params?: {
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
      const filters = JSON.stringify([["tenant", "=", params.tenant]]);
      queryParams += `&filters=${encodeURIComponent(filters)}`;
    } else if (params?.filters) {
      queryParams += `&filters=${encodeURIComponent(params.filters)}`;
    }

    // Use fetch directly to include ERPNext token in Authorization header
    const response = await fetch(`/api/erpnext/application?${queryParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to fetch applications",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch ERPNext applications:", error);
    throw error;
  }
}

// ERPNext Application API - Create a new application
export async function createERPNextApplication(data: {
  application_name: string;
  tenant: string;
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

    const response = await fetch("/api/erpnext/application", {
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
        message: "Failed to create application",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to create ERPNext application:", error);
    throw error;
  }
}

// ERPNext Application API - Update an application
export async function updateERPNextApplication(
  applicationId: string,
  data: {
    application_name?: string;
    tenant?: string;
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

    const response = await fetch(`/api/erpnext/application/${applicationId}`, {
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
        message: "Failed to update application",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to update ERPNext application:", error);
    throw error;
  }
}

// ERPNext Application API - Delete an application
export async function deleteERPNextApplication(applicationId: string) {
  try {
    // Get ERPNext token (with automatic fallback to Keycloak token)
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    const response = await fetch(`/api/erpnext/application/${applicationId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to delete application",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to delete ERPNext application:", error);
    throw error;
  }
}
