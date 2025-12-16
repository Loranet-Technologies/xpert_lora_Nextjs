"use client";

import { useState } from "react";
import OrganizationsAdminPage from "./organizations/page";
import DevicesAdminPage from "./devices/page";
import ApplicationsAdminPage from "./applications/page";
import AdminDashboardPage from "../Admin-Dashbaord/page";
import DeviceProfile from "./deviceProfile/page";
import GatewayAdminPage from "./gateway/page";
import {
  Building2,
  ClipboardList,
  Settings,
  Smartphone,
  Radio,
  BarChart3,
} from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("organizations");

  const tabs = [
    { id: "organizations", name: "Organizations", icon: Building2 },
    { id: "applications", name: "Applications", icon: ClipboardList },
    { id: "deviceProfile", name: "Device Profile", icon: Settings },
    { id: "devices", name: "Devices", icon: Smartphone },
    { id: "gateway", name: "Gateway", icon: Radio },
    {
      id: "Admin-Dashboard",
      name: "Admin Dashboard",
      icon: BarChart3,
      roles: ["admin_role"],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-center items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex space-x-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center ${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <tab.icon className="mr-2 h-4 w-4" />
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content - Show actual page components */}
      <main>
        {activeTab === "organizations" && <OrganizationsAdminPage />}
        {activeTab === "devices" && <DevicesAdminPage />}
        {activeTab === "applications" && <ApplicationsAdminPage />}
        {activeTab === "deviceProfile" && <DeviceProfile />}
        {activeTab === "gateway" && <GatewayAdminPage />}
        {activeTab === "Admin-Dashboard" && <AdminDashboardPage />}
      </main>
    </div>
  );
}
