import { apiClient } from "./apiClient";

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
