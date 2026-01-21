"use client";

import { useApiClient } from "./apiClient";

// Hook-based API functions that automatically include authentication
export function useApi() {
  const apiClient = useApiClient();

  return {
    // Uplinks
    fetchStats: () => apiClient.get("/uplinks/stats"),

    getRecentUplinks: (limit?: number) =>
      apiClient.get("/uplinks/recent", { limit }),

    // Devices
    fetchDevices: () => apiClient.get("/devices"),

    // Applications
    fetchApplications: () => apiClient.get("/applications"),
  };
}
