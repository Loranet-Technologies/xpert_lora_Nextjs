"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Users,
  Settings,
  Database,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  useAdminDashboardData,
  useOrganizationStats,
  useAdminRecentActivity,
} from "@/lib/api/dashboardHooks";

export default function AdminDashboard() {
  const {
    totalDevices,
    totalUsers,
    systemStatus,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useAdminDashboardData();

  const {
    totalOrganizations,
    activeOrganizations,
    isLoading: orgLoading,
    error: orgError,
  } = useOrganizationStats();

  const {
    recentActivity,
    isLoading: activityLoading,
    error: activityError,
  } = useAdminRecentActivity();

  const isLoading = dashboardLoading || orgLoading || activityLoading;
  const hasError = dashboardError || orgError || activityError;

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, your LoRaWAN overview. administrator access.
          </p>
          <div className="flex gap-2 mt-2"></div>
        </div>

        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-red-800">
              Error loading dashboard data. Please try again.
            </span>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Loading...
                  </span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Registered users
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Organizations
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Loading...
                  </span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalOrganizations}</div>
                  <p className="text-xs text-muted-foreground">
                    {activeOrganizations} active organizations
                  </p>
                </>
              )}
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
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Loading...
                  </span>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalDevices}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all organizations
                  </p>
                </>
              )}
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
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Loading...
                  </span>
                </div>
              ) : (
                <>
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
                </>
              )}
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
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">
                    Loading activity...
                  </span>
                </div>
              ) : recentActivity.length > 0 ? (
                recentActivity.slice(0, 5).map((activity: any) => (
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
  );
}
