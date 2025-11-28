"use client";

import { useApiClient } from "./apiClient";

// Hook-based API functions that automatically include authentication
export function useApi() {
  const apiClient = useApiClient();

  return {
    // Uplinks
    fetchUplinks: (params?: {
      limit?: number;
      device_id?: string;
      application_id?: string;
      format?: string;
      start_date?: string;
      end_date?: string;
    }) => apiClient.get("/uplinks", params),

    fetchDeviceUplinks: (deviceId: string, limit?: number) =>
      apiClient.get(`/uplinks/device/${deviceId}`, { limit }),

    fetchStats: () => apiClient.get("/uplinks/stats"),

    getRecentUplinks: (limit?: number) =>
      apiClient.get("/uplinks/recent", { limit }),

    getUplinkApplications: () => apiClient.get("/uplinks/applications"),

    getUplinkDevices: (applicationId?: string) =>
      apiClient.get("/uplinks/devices", { applicationId }),

    simulateUplink: (data: {
      device_id: string;
      application_id: string;
      payload?: unknown;
      f_port?: number;
    }) => apiClient.post("/uplinks/simulate", data),

    // Devices
    fetchDevices: () => apiClient.get("/devices"),

    createDevice: (deviceData: {
      device_id: string;
      application_id: string;
      payload_template?: unknown;
    }) => apiClient.post("/devices", deviceData),

    // Applications
    fetchApplications: () => apiClient.get("/applications"),

    // Organizations (Admin only)
    listOrganizations: (params?: {
      limit?: number;
      offset?: number;
      search?: string;
    }) => apiClient.get("/api/organizations", params),

    createOrganization: (body: { name: string; description?: string }) =>
      apiClient.post("/api/organizations", body),

    updateOrganization: (
      id: string,
      body: {
        name?: string;
        description?: string;
      }
    ) => apiClient.put(`/api/organizations/${id}`, body),

    deleteOrganization: (id: string) =>
      apiClient.delete(`/api/organizations/${id}`),

    // ChirpStack Applications
    listCsApplications: (params: {
      organizationId: string;
      limit?: number;
      offset?: number;
      search?: string;
    }) => apiClient.get("/api/applications", params),

    createCsApplication: (body: {
      name: string;
      organizationId: string;
      description?: string;
    }) => apiClient.post("/api/applications", body),

    updateCsApplication: (
      id: string,
      body: {
        name?: string;
        description?: string;
      }
    ) => apiClient.put(`/api/applications/${id}`, body),

    deleteCsApplication: (id: string) =>
      apiClient.delete(`/api/applications/${id}`),

    // ChirpStack Devices
    listCsDevices: (params: {
      applicationId: string;
      limit?: number;
      offset?: number;
      search?: string;
    }) => apiClient.get("/api/devices", params),

    createCsDevice: (body: {
      name: string;
      devEui: string;
      applicationId: string;
      description?: string;
      deviceProfileId?: string;
    }) => apiClient.post("/api/devices", body),

    updateCsDevice: (
      devEui: string,
      body: {
        name?: string;
        description?: string;
        deviceProfileId?: string;
      }
    ) => apiClient.put(`/api/devices/${devEui}`, body),

    deleteCsDevice: (devEui: string) =>
      apiClient.delete(`/api/devices/${devEui}`),

    // Downlinks
    listDownlinks: (params?: {
      device_eui?: string;
      application_id?: string;
      status?: string;
      limit?: number;
    }) => apiClient.get("/api/downlinks", params),

    sendDownlink: (data: {
      device_eui: string;
      application_id: string;
      f_port: number;
      payload: string;
      confirmed?: boolean;
    }) => apiClient.post("/api/downlinks/send", data),

    sendRawDownlink: (data: {
      device_eui: string;
      application_id: string;
      f_port: number;
      data: string;
      confirmed?: boolean;
    }) => apiClient.post("/api/downlinks/send-raw", data),

    // User Management
    getUserCount: () => apiClient.get("/api/auth/users/count"),

    getKeycloakUsers: (params?: { limit?: number; offset?: number }) =>
      apiClient.get("/api/auth/users/keycloak", params),
  };
}
