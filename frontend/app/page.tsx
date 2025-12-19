"use client";

import { useState } from "react";
import { useAuth } from "../lib/auth/AuthProvider";
import LoginPage from "../components/LoginPage";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "../components/ui/sidebar";
import { AppSidebar } from "../components/app-sidebar";
import UserDashboard from "./pages/userDashaboard/page";
import OrganizationsAdminPage from "./pages/organizations/page";
import AdminDashboardPage from "./pages/Admin-Dashbaord/page";
import ApplicationsAdminPage from "./pages/applications/page";
import DevicesAdminPage from "./pages/devices/page";
import DeviceProfileAdminPage from "./pages/deviceProfile/page";
import GatewayAdminPage from "./pages/gateway/page";
import GatewayListPage from "./pages/gateway-list/page";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("organizations");

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <SidebarProvider>
      <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {/* Content - Show actual page components */}
          {activeTab === "organizations" && <OrganizationsAdminPage />}
          {activeTab === "applications" && <ApplicationsAdminPage />}
          {activeTab === "deviceProfile" && <DeviceProfileAdminPage />}
          {activeTab === "devices" && <DevicesAdminPage />}
          {activeTab === "gateway" && <GatewayAdminPage />}
          {activeTab === "gatewayList" && <GatewayListPage />}
          {activeTab === "Admin-Dashboard" && <AdminDashboardPage />}
          {activeTab === "Userdashboard" && <UserDashboard />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
