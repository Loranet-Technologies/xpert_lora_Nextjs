"use client";

import { useState } from "react";
import { useAuth } from "../lib/auth/AuthProvider";
import LoginPage from "../components/LoginPage";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

// Import the actual page components
import DevicesPage from "./pages/devices/page";
import ApplicationsPage from "./pages/applications/page";
import UserDashboard from "./pages/userDashaboard/page";
import OrganizationsAdminPage from "./pages/admin/organizations/page";
import DeviceProfile from "./pages/admin/deviceProfile/page";
import AdminDashboardPage from "./pages/Admin-Dashbaord/page";
import {
  LogOutIcon,
  Building2,
  ClipboardList,
  Settings,
  Smartphone,
  Radio,
  BarChart3,
  User,
} from "lucide-react";
import ApplicationsAdminPage from "./pages/admin/applications/page";
import DevicesAdminPage from "./pages/admin/devices/page";
import DeviceProfileAdminPage from "./pages/admin/deviceProfile/page";
import GatewayAdminPage from "./pages/admin/gateway/page";

export default function Home() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
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

  // Define all available tabs
  const allTabs = [
    { id: "organizations", name: "Organizations", icon: "" },
    { id: "applications", name: "Applications", icon: "" },
    { id: "deviceProfile", name: "Device Profile", icon: "" },
    { id: "devices", name: "Devices", icon: "" },
    { id: "gateway", name: "Gateway", icon: "" },
    {
      id: "Admin-Dashboard",
      name: "Admin Dashboard",
      icon: "",
      roles: ["admin_role"],
    },
    {
      id: "Userdashboard",
      name: "User Dashboard",
      icon: "",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">
                LoRaWAN Dashboard
              </h1>
              <div className="flex space-x-1">
                {allTabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={`flex flex-col items-center gap-1 px-2 py-2 rounded-md ${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={` flex flex-col items-center gap-1 text-sm font-medium transition-colors duration-200 ${
                        activeTab === tab.id ? "text-blue-700" : "text-gray-600"
                      }`}
                    >
                      {tab.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4 ml-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2 py-6"
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {(user?.firstName || user?.username || user?.id || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user?.username || user?.id || "User"}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user?.username || user?.id || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email || "No email"}
                      </p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <span className="mr-2">
                      <LogOutIcon size={16} />
                    </span>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Content - Show actual page components */}
      <main>
        {activeTab === "organizations" && <OrganizationsAdminPage />}
        {activeTab === "applications" && <ApplicationsAdminPage />}
        {activeTab === "deviceProfile" && <DeviceProfileAdminPage />}
        {activeTab === "devices" && <DevicesAdminPage />}
        {activeTab === "gateway" && <GatewayAdminPage />}
        {activeTab === "Admin-Dashboard" && <AdminDashboardPage />}
        {activeTab === "Userdashboard" && <UserDashboard />}
      </main>
    </div>
  );
}
