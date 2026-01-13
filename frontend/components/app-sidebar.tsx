"use client";

import * as React from "react";
import {
  Building2,
  ClipboardList,
  Settings,
  Smartphone,
  Radio,
  LogOut,
  List,
  LayoutDashboard,
  CreditCard,
  Shield,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigation } from "@/components/customHooks/useNavigation";
import { mapPathToTab } from "@/utils/mapPathToTab";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// This is the data for the navigation items
const navigationItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    id: "dashboard",
    path: "/pages/dashboard",
  },
  {
    title: "Organizations",
    icon: Building2,
    id: "organizations",
    path: "/pages/organizations",
  },
  {
    title: "Applications",
    icon: ClipboardList,
    id: "applications",
    path: "/pages/applications",
  },
  {
    title: "Device Profile",
    icon: Settings,
    id: "deviceProfile",
    path: "/pages/deviceProfile",
  },
  {
    title: "Devices",
    icon: Smartphone,
    id: "devices",
    path: "/pages/devices",
  },
  {
    title: "Gateway",
    icon: Radio,
    id: "gateway",
    path: "/pages/gateway",
  },
  {
    title: "Gateway List",
    icon: List,
    id: "gatewayList",
    path: "/pages/gateway-list",
  },
  {
    title: "Device List",
    icon: List,
    id: "deviceList",
    path: "/pages/device-list",
  },
  {
    title: "Subscription",
    icon: CreditCard,
    id: "subscription",
    path: "/pages/subscription",
  },
  {
    title: "Subscription Management",
    icon: Shield,
    id: "subscriptionManagement",
    path: "/pages/subscription-management",
  },
];

interface AppSidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export function AppSidebar({
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
}: AppSidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { activeTab: hookActiveTab, setActiveTabState } = useNavigation();

  // Use prop values if provided, otherwise use hook values
  const activeTab = propActiveTab ?? hookActiveTab;
  const setActiveTab = propSetActiveTab ?? setActiveTabState;

  // Update the activeTab based on the current pathname
  useEffect(() => {
    if (pathname) {
      const tab = mapPathToTab(pathname);
      setActiveTab(tab);
    }
  }, [pathname, setActiveTab]);

  // Handle navigation when sidebar item is clicked
  const handleNavigation = (path: string, id: string) => {
    setActiveTab(id);
    router.push(path);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Radio className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    LoRaWAN Dashboard
                  </span>
                  <span className="truncate text-xs">Network Management</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={activeTab === item.id}
                    onClick={() => handleNavigation(item.path, item.id)}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {(user?.firstName || user?.username || user?.id || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.username || user?.id || "User"}
                    </span>
                    <span className="truncate text-xs">
                      {user?.email || "No email"}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg">
                        {(user?.firstName || user?.username || user?.id || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user?.username || user?.id || "User"}
                      </span>
                      <span className="truncate text-xs">
                        {user?.email || "No email"}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
