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
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { Database, Zap, Shield, Radio, Settings } from "lucide-react";
import Header from "@/components/header";

// Fake data
const fakeStats = {
  totalOrganizations: 5,
  activeOrganizations: 4,
  totalApplications: 12,
  totalDevices: 48,
  totalGateways: 8,
  systemStatus: "Healthy",
};

const fakeRecentActivity = [
  {
    id: 1,
    description: "New device registered: Device-001",
    timeAgo: "5 minutes ago",
  },
  {
    id: 2,
    description: "Gateway sync completed for Tenant-A",
    timeAgo: "15 minutes ago",
  },
  {
    id: 3,
    description: "Application created: Smart Agriculture",
    timeAgo: "1 hour ago",
  },
  {
    id: 4,
    description: "Device profile updated: LoRaWAN 1.0.3",
    timeAgo: "2 hours ago",
  },
  {
    id: 5,
    description: "New tenant created: Industrial Solutions",
    timeAgo: "3 hours ago",
  },
];

const DashboardPage = () => {
  const {
    totalOrganizations,
    activeOrganizations,
    totalApplications,
    totalDevices,
    totalGateways,
    systemStatus,
  } = fakeStats;
  const recentActivity = fakeRecentActivity;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <Header />
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="mx-auto w-full max-w-6xl space-y-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, your LoRaWAN overview.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Organizations
                  </CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalOrganizations}</div>
                  <p className="text-xs text-muted-foreground">
                    {activeOrganizations} active tenants
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Applications
                  </CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalApplications}</div>
                  <p className="text-xs text-muted-foreground">From ERPNext</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Devices
                  </CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalDevices}</div>
                  <p className="text-xs text-muted-foreground">From ERPNext</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Gateways
                  </CardTitle>
                  <Radio className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalGateways}</div>
                  <p className="text-xs text-muted-foreground">From ERPNext</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    System Status
                  </CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      systemStatus === "Healthy"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {systemStatus}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All systems operational
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Actions</CardTitle>
                  <CardDescription>
                    Administrative functions available to you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Manage Organizations</span>
                    <Badge variant="default">Full Access</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>User Management</span>
                    <Badge variant="default">Full Access</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>System Configuration</span>
                    <Badge variant="default">Full Access</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span>Device Management</span>
                    <Badge variant="default">Full Access</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest system activities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recentActivity.length > 0 ? (
                    recentActivity.slice(0, 5).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-2 border-b"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.timeAgo}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4 text-muted-foreground">
                      <p className="text-sm">No recent activity</p>
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
};

export default DashboardPage;
