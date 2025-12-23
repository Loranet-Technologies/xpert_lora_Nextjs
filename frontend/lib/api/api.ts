import { apiClient } from "./apiClient";
import Cookies from "js-cookie";

// Helper function to get ERPNext token, with fallback to Keycloak token
async function getERPNextToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  // First, try to get ERPNext token from localStorage
  let token = localStorage.getItem("erpnext_token");
  if (token) {
    return token;
  }

  // Try to get from cookies
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "erpnext_token") {
      token = value;
      if (token) {
        // Also store in localStorage for consistency
        localStorage.setItem("erpnext_token", token);
        return token;
      }
    }
  }

  // Fallback: Try to get Keycloak token and authenticate with ERPNext
  // Get Keycloak token from NextAuth session
  try {
    const sessionResponse = await fetch("/api/auth/session");
    if (sessionResponse.ok) {
      const session = await sessionResponse.json();
      if (session?.accessToken) {
        // Try to authenticate with ERPNext using Keycloak token via SSO
        try {
          const erpnextLoginResponse = await fetch(
            "/api/erpnext/login-with-keycloak",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ keycloakToken: session.accessToken }),
              credentials: "include",
            }
          );

          if (erpnextLoginResponse.ok) {
            const data = await erpnextLoginResponse.json();
            if (data.token) {
              // Store the ERPNext token for future use
              localStorage.setItem("erpnext_token", data.token);
              Cookies.set("erpnext_token", data.token, { expires: 7 });
              localStorage.setItem("erpnext_session_active", "true");

              // Also store API credentials if available
              if (data.api_key) {
                localStorage.setItem("erpnext_api_key", data.api_key);
              }
              if (data.api_secret) {
                localStorage.setItem("erpnext_api_secret", data.api_secret);
              }

              return data.token;
            }
          } else {
            // SSO login failed, but we can still use Keycloak token
            // The ERPNext auth hook should validate it
            console.warn(
              "ERPNext SSO login failed, using Keycloak token directly"
            );
            return session.accessToken;
          }
        } catch (error) {
          console.warn("Failed to get ERPNext token with Keycloak:", error);
          // Fallback to Keycloak token - auth hook should handle it
          return session.accessToken;
        }
      }
    }
  } catch (error) {
    console.warn("Failed to get session:", error);
  }

  return null;
}

export async function fetchUplinks(params?: {
  limit?: number;
  device_id?: string;
  application_id?: string;
  format?: string;
  start_date?: string;
  end_date?: string;
}) {
  try {
    return await apiClient.get("/uplinks", params);
  } catch (error) {
    console.error("Failed to fetch uplinks:", error);
    throw error;
  }
}

export async function fetchDeviceUplinks(deviceId: string, limit?: number) {
  try {
    return await apiClient.get(`/uplinks/device/${deviceId}`, { limit });
  } catch (error) {
    console.error("Failed to fetch device uplinks:", error);
    throw error;
  }
}

export async function fetchStats() {
  try {
    return await apiClient.get("/uplinks/stats");
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    throw error;
  }
}

export async function fetchDevices() {
  try {
    return await apiClient.get("/devices");
  } catch (error) {
    console.error("Failed to fetch devices:", error);
    throw error;
  }
}

export async function fetchApplications() {
  try {
    return await apiClient.get("/applications");
  } catch (error) {
    console.error("Failed to fetch applications:", error);
    throw error;
  }
}

export async function createDevice(deviceData: {
  device_id: string;
  application_id: string;
  payload_template?: unknown;
}) {
  try {
    console.log("🚀 Creating device with data:", deviceData);
    const result = await apiClient.post("/devices", deviceData);
    console.log("📡 Device created successfully");
    return result;
  } catch (error) {
    console.error("Failed to create device:", error);
    throw error;
  }
}

// ChirpStack-backed admin APIs
const BASE_URL = "/api";

// Organizations (Tenants)
export async function listOrganizations(params?: {
  limit?: number;
  offset?: number;
  search?: string;
}) {
  try {
    return await apiClient.get(`${BASE_URL}/organizations`, params);
  } catch (error) {
    console.error("Failed to list organizations:", error);
    throw error;
  }
}

export async function createOrganization(body: {
  name: string;
  description?: string;
}) {
  try {
    return await apiClient.post(`${BASE_URL}/organizations`, body);
  } catch (error) {
    console.error("Failed to create organization:", error);
    throw error;
  }
}

export async function updateOrganization(
  id: string,
  body: { name?: string; description?: string }
) {
  try {
    return await apiClient.put(`${BASE_URL}/organizations/${id}`, body);
  } catch (error) {
    console.error("Failed to update organization:", error);
    throw error;
  }
}

export async function deleteOrganization(id: string) {
  try {
    return await apiClient.delete(`${BASE_URL}/organizations/${id}`);
  } catch (error) {
    console.error("Failed to delete organization:", error);
    throw error;
  }
}

// Applications (scoped to organization)
export async function listCsApplications(params: {
  organizationId: string;
  limit?: number;
  offset?: number;
  search?: string;
}) {
  try {
    return await apiClient.get(`${BASE_URL}/applications`, params);
  } catch (error) {
    console.error("Failed to list applications:", error);
    throw error;
  }
}

export async function createCsApplication(body: {
  name: string;
  organizationId: string;
  description?: string;
}) {
  try {
    return await apiClient.post(`${BASE_URL}/applications`, body);
  } catch (error) {
    console.error("Failed to create application:", error);
    throw error;
  }
}

export async function updateCsApplication(
  id: string,
  body: { name?: string; description?: string }
) {
  try {
    return await apiClient.put(`${BASE_URL}/applications/${id}`, body);
  } catch (error) {
    console.error("Failed to update application:", error);
    throw error;
  }
}

export async function deleteCsApplication(id: string) {
  try {
    return await apiClient.delete(`${BASE_URL}/applications/${id}`);
  } catch (error) {
    console.error("Failed to delete application:", error);
    throw error;
  }
}

// Devices (scoped to application)
export async function listCsDevices(params: {
  applicationId: string;
  limit?: number;
  offset?: number;
  search?: string;
}) {
  try {
    return await apiClient.get(`${BASE_URL}/devices`, params);
  } catch (error) {
    console.error("Failed to list devices:", error);
    throw error;
  }
}

export async function createCsDevice(body: {
  name: string;
  devEui: string;
  applicationId: string;
  description?: string;
  deviceProfileId?: string;
}) {
  try {
    return await apiClient.post(`${BASE_URL}/devices`, body);
  } catch (error) {
    console.error("Failed to create device:", error);
    throw error;
  }
}

export async function updateCsDevice(
  devEui: string,
  body: { name?: string; description?: string; deviceProfileId?: string }
) {
  try {
    return await apiClient.put(`${BASE_URL}/devices/${devEui}`, body);
  } catch (error) {
    console.error("Failed to update device:", error);
    throw error;
  }
}

export async function deleteCsDevice(devEui: string) {
  try {
    return await apiClient.delete(`${BASE_URL}/devices/${devEui}`);
  } catch (error) {
    console.error("Failed to delete device:", error);
    throw error;
  }
}

// Device Profiles
export async function listCsDeviceProfiles(params: {
  tenantId: string;
  limit?: number;
  offset?: number;
  search?: string;
}) {
  try {
    return await apiClient.get(`${BASE_URL}/devices/profiles`, params);
  } catch (error) {
    console.error("Failed to list device profiles:", error);
    throw error;
  }
}

export async function createCsDeviceProfile(body: {
  name: string;
  tenantId: string;
  description?: string;
  region?: string;
}) {
  try {
    return await apiClient.post(`${BASE_URL}/devices/profiles`, body);
  } catch (error) {
    console.error("Failed to create device profile:", error);
    throw error;
  }
}

export async function updateCsDeviceProfile(
  id: string,
  body: { name?: string; description?: string; region?: string }
) {
  try {
    return await apiClient.put(`${BASE_URL}/devices/profiles/${id}`, body);
  } catch (error) {
    console.error("Failed to update device profile:", error);
    throw error;
  }
}

export async function getCsDeviceProfile(id: string) {
  try {
    return await apiClient.get(`${BASE_URL}/devices/profiles/${id}`);
  } catch (error) {
    console.error("Failed to get device profile:", error);
    throw error;
  }
}

export async function deleteCsDeviceProfile(id: string) {
  try {
    return await apiClient.delete(`${BASE_URL}/devices/profiles/${id}`);
  } catch (error) {
    console.error("Failed to delete device profile:", error);
    throw error;
  }
}

// Downlinks API functions
export async function listDownlinks(params?: {
  device_eui?: string;
  application_id?: string;
  status?: string;
  limit?: number;
}) {
  try {
    return await apiClient.get(`${BASE_URL}/downlinks`, params);
  } catch (error) {
    console.error("Failed to list downlinks:", error);
    throw error;
  }
}

export async function sendDownlink(data: {
  device_eui: string;
  application_id: string;
  f_port: number;
  payload: string; // hex string
  confirmed?: boolean;
}) {
  try {
    return await apiClient.post(`${BASE_URL}/downlinks/send`, data);
  } catch (error) {
    console.error("Failed to send downlink:", error);
    throw error;
  }
}

export async function sendRawDownlink(data: {
  device_eui: string;
  application_id: string;
  f_port: number;
  data: string; // base64 encoded
  confirmed?: boolean;
}) {
  try {
    return await apiClient.post(`${BASE_URL}/downlinks/send-raw`, data);
  } catch (error) {
    console.error("Failed to send raw downlink:", error);
    throw error;
  }
}

// Enhanced Uplinks API functions

export async function getRecentUplinks(limit?: number) {
  try {
    return await apiClient.get("/uplinks/recent", { limit });
  } catch (error) {
    console.error("Failed to get recent uplinks:", error);
    throw error;
  }
}

export async function getUplinkApplications() {
  try {
    return await apiClient.get("/uplinks/applications");
  } catch (error) {
    console.error("Failed to get uplink applications:", error);
    throw error;
  }
}

export async function getUplinkDevices(applicationId?: string) {
  try {
    return await apiClient.get("/uplinks/devices", { applicationId });
  } catch (error) {
    console.error("Failed to get uplink devices:", error);
    throw error;
  }
}

export async function simulateUplink(data: {
  device_id: string;
  application_id: string;
  payload?: unknown;
  f_port?: number;
}) {
  try {
    return await apiClient.post("/uplinks/simulate", data);
  } catch (error) {
    console.error("Failed to simulate uplink:", error);
    throw error;
  }
}

// ERPNext Authentication API - Using Next.js API proxy to avoid CORS issues
export async function loginWithERPNext(credentials: {
  usr: string;
  pwd: string;
}) {
  try {
    // Use Next.js API route as proxy to avoid CORS issues
    const response = await fetch("/api/erpnext/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
      credentials: "include", // Important for cookie-based sessions
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Login failed",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to login with ERPNext:", error);
    throw error;
  }
}

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

// ERPNext Tenant API - Get a single tenant by ID
export async function getERPNextTenant(tenantId: string) {
  try {
    // Get ERPNext token (with automatic fallback to Keycloak token)
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    const response = await fetch(`/api/erpnext/tenant/${tenantId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to fetch tenant",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get ERPNext tenant:", error);
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

// ERPNext Application API - Get a single application by ID
export async function getERPNextApplication(applicationId: string) {
  try {
    // Get ERPNext token (with automatic fallback to Keycloak token)
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    const response = await fetch(`/api/erpnext/application/${applicationId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to fetch application",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get ERPNext application:", error);
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

// ERPNext Device Profile API - Get a single device profile by ID
export async function getERPNextDeviceProfile(deviceProfileId: string) {
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
        message: "Failed to fetch device profile",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get ERPNext device profile:", error);
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
