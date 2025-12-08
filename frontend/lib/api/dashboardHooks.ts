"use client";

import { useApi } from "./apiHooks";
import { useState, useEffect } from "react";
import {
  fetchERPNextTenants,
  fetchERPNextApplications,
  fetchERPNextDevices,
  fetchERPNextGateways,
} from "./api";

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
  const [totalApplications, setTotalApplications] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalGateways, setTotalGateways] = useState(0);
  const [systemStatus, setSystemStatus] = useState("Healthy");
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch tenants (organizations) from ERPNext
        try {
          const tenantsData = await fetchERPNextTenants({ fields: ["*"] });
          const tenants = (tenantsData as any).data || [];
          setOrganizations(tenants);
        } catch (err) {
          console.warn("Failed to fetch tenants:", err);
          setOrganizations([]);
        }

        // Fetch all applications from ERPNext
        try {
          const applicationsData = await fetchERPNextApplications({
            fields: ["*"],
          });
          const applications = (applicationsData as any).data || [];
          setTotalApplications(applications.length);
        } catch (err) {
          console.warn("Failed to fetch applications:", err);
          setTotalApplications(0);
        }

        // Fetch all devices from ERPNext
        try {
          const devicesData = await fetchERPNextDevices({ fields: ["*"] });
          const devices = (devicesData as any).data || [];
          setTotalDevices(devices.length);
        } catch (err) {
          console.warn("Failed to fetch devices:", err);
          setTotalDevices(0);
        }

        // Fetch all gateways from ERPNext
        try {
          const gatewaysData = await fetchERPNextGateways({ fields: ["*"] });
          const gateways = (gatewaysData as any).data || [];
          setTotalGateways(gateways.length);
        } catch (err) {
          console.warn("Failed to fetch gateways:", err);
          setTotalGateways(0);
        }

        // Fetch total users - for now set to 0 as we don't have a user count API
        // You can implement this if you have a user count endpoint
        setTotalUsers(0);

        // Fetch recent activity (using recent uplinks as a proxy)
        try {
          const recentUplinks = (await api.getRecentUplinks(10)) as any;
          setRecentActivity(recentUplinks.data || []);
        } catch (err) {
          console.warn("Failed to fetch recent activity:", err);
          setRecentActivity([]);
        }

        // System status - assume healthy if we can fetch data
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
    totalApplications,
    totalUsers,
    totalGateways,
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
    // Consider an organization active if it has a status or was modified recently
    if (org.status === "Active") return true;
    if (org.modified) {
      const modifiedAt = new Date(org.modified);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return modifiedAt > oneWeekAgo;
    }
    return false;
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

  const formattedActivity = recentActivity
    .filter((activity: any) => activity && activity.ts)
    .map((activity: any) => {
      try {
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
      } catch (err) {
        console.warn("Error formatting activity:", err);
        return null;
      }
    })
    .filter((activity: any) => activity !== null);

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
