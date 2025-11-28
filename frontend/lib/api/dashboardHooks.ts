"use client";

import { useApi } from "./apiHooks";
import { useState, useEffect } from "react";

// Custom hooks for dashboard data
export function useDashboardData() {
  const api = useApi();
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({
    total_uplinks: 0,
    unique_devices: 0,
    unique_applications: 0,
    uplinks_last_24h: 0,
  });
  const [recentUplinks, setRecentUplinks] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [devicesData, statsData, recentUplinksData, applicationsData] =
          await Promise.all([
            api.fetchDevices().catch((err) => ({ devices: [], error: err })),
            api.fetchStats().catch((err) => ({ stats: stats, error: err })),
            api.getRecentUplinks(5).catch((err) => ({ data: [], error: err })),
            api
              .fetchApplications()
              .catch((err) => ({ applications: [], error: err })),
          ]);

        if ((devicesData as any).devices)
          setDevices((devicesData as any).devices);
        if ((statsData as any).stats) setStats((statsData as any).stats);
        if ((recentUplinksData as any).data)
          setRecentUplinks((recentUplinksData as any).data);
        if ((applicationsData as any).applications)
          setApplications((applicationsData as any).applications);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    devices,
    stats,
    recentUplinks,
    applications,
    isLoading,
    error,
  };
}

// Hook for device count and activity
export function useDeviceStats() {
  const { devices, isLoading, error } = useDashboardData();

  const activeDevices = devices.filter((device: any) => {
    const lastSeen = new Date(device.last_seen);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return lastSeen > oneDayAgo;
  }).length;

  const totalUplinks = devices.reduce(
    (sum: number, device: any) => sum + (device.total_uplinks || 0),
    0
  );

  return {
    totalDevices: devices.length,
    activeDevices,
    totalUplinks,
    isLoading,
    error,
  };
}

// Hook for recent activity
export function useRecentActivity() {
  const { recentUplinks, isLoading, error } = useDashboardData();

  const formattedRecentUplinks = recentUplinks.map((uplink: any) => {
    const timeAgo = getTimeAgo(new Date(uplink.ts));
    const deviceId = uplink.device_id || "Unknown";

    // Try to extract meaningful data from payload
    let displayData = "No data";
    if (uplink.payload?.decoded_payload) {
      const decoded = uplink.payload.decoded_payload;
      if (decoded.temperature !== undefined) {
        displayData = `Temperature: ${decoded.temperature}°C`;
      } else if (decoded.humidity !== undefined) {
        displayData = `Humidity: ${decoded.humidity}%`;
      } else if (decoded.battery !== undefined) {
        displayData = `Battery: ${decoded.battery}%`;
      } else if (decoded.voltage !== undefined) {
        displayData = `Voltage: ${decoded.voltage}V`;
      } else {
        displayData = "Sensor data";
      }
    } else if (uplink.payload?.frm_payload) {
      displayData = `Raw: ${uplink.payload.frm_payload}`;
    }

    return {
      deviceId,
      displayData,
      timeAgo,
      timestamp: uplink.ts,
    };
  });

  return {
    recentUplinks: formattedRecentUplinks,
    isLoading,
    error,
  };
}

// Admin-specific dashboard hooks
export function useAdminDashboardData() {
  const api = useApi();
  const [organizations, setOrganizations] = useState([]);
  const [totalDevices, setTotalDevices] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [systemStatus, setSystemStatus] = useState("Healthy");
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch organizations data
        const orgsData = (await api.listOrganizations({ limit: 100 })) as any;
        setOrganizations(orgsData.resultList || []);

        // Fetch total devices across all organizations
        let totalDevicesCount = 0;
        if (orgsData.resultList) {
          for (const org of orgsData.resultList) {
            try {
              const appsData = (await api.listCsApplications({
                organizationId: org.id,
                limit: 100,
              })) as any;
              if (appsData.resultList) {
                for (const app of appsData.resultList) {
                  try {
                    const devicesData = (await api.listCsDevices({
                      applicationId: app.id,
                      limit: 100,
                    })) as any;
                    totalDevicesCount += devicesData.resultList?.length || 0;
                  } catch (err) {
                    console.warn(
                      `Failed to fetch devices for app ${app.id}:`,
                      err
                    );
                  }
                }
              }
            } catch (err) {
              console.warn(
                `Failed to fetch applications for org ${org.id}:`,
                err
              );
            }
          }
        }
        setTotalDevices(totalDevicesCount);

        // Fetch total users from Keycloak
        try {
          const userCountData = (await api.getUserCount()) as any;
          setTotalUsers(userCountData.totalUsers || 0);
        } catch (err) {
          console.warn("Failed to fetch user count:", err);
          setTotalUsers(0);
        }

        // Fetch recent activity (using recent uplinks as a proxy)
        try {
          const recentUplinks = (await api.getRecentUplinks(10)) as any;
          setRecentActivity(recentUplinks.data || []);
        } catch (err) {
          console.warn("Failed to fetch recent activity:", err);
          setRecentActivity([]);
        }

        // System status - for now, assume healthy if we can fetch data
        setSystemStatus("Healthy");
      } catch (err) {
        console.error("Error fetching admin dashboard data:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  return {
    organizations,
    totalDevices,
    totalUsers,
    systemStatus,
    recentActivity,
    isLoading,
    error,
  };
}

// Hook for organization statistics
export function useOrganizationStats() {
  const { organizations, isLoading, error } = useAdminDashboardData();

  const activeOrganizations = organizations.filter((org: any) => {
    // Consider an organization active if it was updated recently
    const updatedAt = new Date(org.updatedAt?.seconds * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return updatedAt > oneWeekAgo;
  }).length;

  return {
    totalOrganizations: organizations.length,
    activeOrganizations,
    isLoading,
    error,
  };
}

// Hook for recent admin activity
export function useAdminRecentActivity() {
  const { recentActivity, isLoading, error } = useAdminDashboardData();

  const formattedActivity = recentActivity.map((activity: any) => {
    const timeAgo = getTimeAgo(new Date(activity.ts));
    const deviceId = activity.device_id || "Unknown";
    const applicationId = activity.application_id || "Unknown";

    return {
      id: activity.id || Math.random().toString(),
      type: "Device Activity",
      description: `Device ${deviceId} sent data`,
      applicationId,
      timeAgo,
      timestamp: activity.ts,
    };
  });

  return {
    recentActivity: formattedActivity,
    isLoading,
    error,
  };
}

// Utility function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
}
