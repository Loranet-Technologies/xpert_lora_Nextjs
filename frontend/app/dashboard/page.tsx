"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, LayoutGrid } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AlertItem } from "@/components/header";
import { OverviewDashboard } from "@/components/dashboard/OverviewDashboard";
import { IoTDashboard } from "@/components/custom-dashboard/IoTDashboard";

type DashboardTab = "overview" | "iot";

export default function DashboardPage() {
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    if (tab === "iot") setAlerts([]);
  }, [tab]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header alerts={alerts} />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as DashboardTab)}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Dashboard
                </h1>
                <p className="text-muted-foreground text-sm">
                  Overview and IoT widgets in one place.
                </p>
              </div>
              <TabsList>
                <TabsTrigger value="overview">
                  <LayoutDashboard className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="iot">
                  <LayoutGrid className="h-4 w-4" />
                  IoT Dashboard
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="mt-2">
              <OverviewDashboard onAlertsChange={setAlerts} />
            </TabsContent>
            <TabsContent value="iot" className="mt-2">
              <IoTDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
