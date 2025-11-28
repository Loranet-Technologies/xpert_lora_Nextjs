"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Wifi, Zap, TrendingUp, Loader2 } from "lucide-react";
import {
  useDashboardData,
  useDeviceStats,
  useRecentActivity,
} from "@/lib/api/dashboardHooks";

export default function UserDashboard() {
  const { stats, isLoading, error } = useDashboardData();
  const { totalDevices, activeDevices, totalUplinks } = useDeviceStats();
  const { recentUplinks } = useRecentActivity();

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center text-red-600">
          <p>Error loading dashboard data. Please try again later.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">User Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, your LoRaWAN overview.
          </p>
          <div className="flex gap-2 mt-2"></div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Devices</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDevices}</div>
              <p className="text-xs text-muted-foreground">
                {activeDevices} active in last 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Sessions
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeDevices}</div>
              <p className="text-xs text-muted-foreground">Currently online</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Uplinks
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_uplinks.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Activity
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.uplinks_last_24h.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Actions</CardTitle>
              <CardDescription>Functions available to you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-2 border rounded">
                <span>View My Devices</span>
                <Badge variant="default">Allowed</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span>Send Downlinks</span>
                <Badge variant="default">Allowed</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span>View Uplinks</span>
                <Badge variant="default">Allowed</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span>Create Devices</span>
                <Badge variant="secondary">Limited</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>
                Latest uplink messages from your devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentUplinks.length > 0 ? (
                recentUplinks.map((uplink, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border-b"
                  >
                    <div>
                      <p className="text-sm font-medium">{uplink.deviceId}</p>
                      <p className="text-xs text-muted-foreground">
                        {uplink.displayData}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {uplink.timeAgo}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <p>No recent messages</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
