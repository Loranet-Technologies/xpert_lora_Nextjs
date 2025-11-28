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
import CreateDevicePage from "./pages/create-device/page";
import EnhancedUplinksPage from "./pages/enhanced-uplinks/page";
import DownlinksPage from "./pages/downlinks/page";
import AdminPage from "./pages/admin/page";
import UserDashboard from "./pages/userDashaboard/page";
import { LogOutIcon } from "lucide-react";

export default function Home() {
  const { isAuthenticated, isLoading, roles, logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState("uplinks");

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

  // Define tabs based on user roles
  const allTabs = [
    {
      id: "uplinks",
      name: "Uplinks",
      icon: "📡",
      roles: ["user_role", "admin_role"],
    },
    {
      id: "downlinks",
      name: "Downlinks",
      icon: "🔧",
      roles: ["user_role", "admin_role"],
    },
    {
      id: "devices",
      name: "Devices",
      icon: "📱",
      roles: ["user_role", "admin_role"],
    },
    {
      id: "applications",
      name: "Applications",
      icon: "📋",
      roles: ["user_role", "admin_role"],
    },
    {
      id: "create",
      name: "Create Device",
      icon: "🔧",
      roles: ["user_role", "admin_role"],
    },
    {
      id: "Userdashboard",
      name: "User Dashboard",
      icon: "👤",
      roles: ["user_role", "admin_role"],
    },
    { id: "Admin", name: "Admin", icon: "⚙️", roles: ["admin_role"] },
  ];

  // Filter tabs based on user roles
  const availableTabs = allTabs.filter((tab) =>
    tab.roles.some((role) => roles.includes(role))
  );

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
                {availableTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-2 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
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
        {activeTab === "uplinks" && <EnhancedUplinksPage />}
        {activeTab === "Userdashboard" && <UserDashboard />}
        {activeTab === "devices" && <DevicesPage />}
        {activeTab === "applications" && <ApplicationsPage />}
        {activeTab === "create" && <CreateDevicePage />}
        {activeTab === "downlinks" && <DownlinksPage />}
        {activeTab === "Admin" && <AdminPage />}
      </main>
    </div>
  );
}
