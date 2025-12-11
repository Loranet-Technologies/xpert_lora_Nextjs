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

// ERPNext Tenant API - Fetch tenants from ERPNext
export async function fetchERPNextTenants(params?: { fields?: string[] }) {
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

    // Use fetch directly to include ERPNext token in Authorization header
    const response = await fetch(
      `/api/erpnext/tenant?fields=${encodeURIComponent(fieldsParam)}`,
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

// ERPNext Application API - Fetch applications from ERPNext
export async function fetchERPNextApplications(params?: {
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

// ERPNext Device Profile API - Fetch device profiles from ERPNext
export async function fetchERPNextDeviceProfiles(params?: {
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

// ERPNext Device API - Fetch devices from ERPNext
export async function fetchERPNextDevices(params?: {
  fields?: string[];
  filters?: string;
  application?: string;
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
