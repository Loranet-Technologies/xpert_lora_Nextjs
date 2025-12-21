"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { Activity, Wifi, Zap, TrendingUp } from "lucide-react";

// Fake data
const fakeStats = {
  total_uplinks: 1250,
  uplinks_last_24h: 45,
};

const fakeDeviceStats = {
  totalDevices: 12,
  activeDevices: 8,
};

const fakeRecentUplinks = [
  {
    deviceId: "Device-001",
    displayData: "Temperature: 22.5°C, Humidity: 65%",
    timeAgo: "2 minutes ago",
  },
  {
    deviceId: "Device-002",
    displayData: "Motion detected in Zone A",
    timeAgo: "15 minutes ago",
  },
  {
    deviceId: "Device-003",
    displayData: "Battery level: 85%",
    timeAgo: "1 hour ago",
  },
  {
    deviceId: "Device-001",
    displayData: "Temperature: 23.1°C, Humidity: 64%",
    timeAgo: "2 hours ago",
  },
  {
    deviceId: "Device-004",
    displayData: "Door opened",
    timeAgo: "3 hours ago",
  },
];

export default function UserDashboard() {
  const stats = fakeStats;
  const { totalDevices, activeDevices } = fakeDeviceStats;
  const recentUplinks = fakeRecentUplinks;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="mx-auto w-full max-w-6xl space-y-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                User Dashboard
              </h1>
              <p className="text-muted-foreground">
                Welcome back, your LoRaWAN overview.
              </p>
              <div className="flex gap-2 mt-2"></div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    My Devices
                  </CardTitle>
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
                  <p className="text-xs text-muted-foreground">
                    Currently online
                  </p>
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
                          <p className="text-sm font-medium">
                            {uplink.deviceId}
                          </p>
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
      </SidebarInset>
    </SidebarProvider>
  );
}
