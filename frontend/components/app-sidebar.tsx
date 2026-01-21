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
  Users,
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
import { Button } from "./ui/button";

// This is the data for the navigation items
// Add 'requiredRole' property to restrict items to specific roles
// If not specified, the item is visible to all users
const navigationItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    id: "dashboard",
    path: "/pages/dashboard",
    requiredRole: undefined, // Available to all users
  },
  {
    title: "Organizations",
    icon: Building2,
    id: "organizations",
    path: "/pages/organizations",
    requiredRole: "admin", // Admin only
  },
  {
    title: "Applications",
    icon: ClipboardList,
    id: "applications",
    path: "/pages/applications",
    requiredRole: undefined, // Available to all users
  },
  {
    title: "Device Profile",
    icon: Settings,
    id: "deviceProfile",
    path: "/pages/deviceProfile",
    requiredRole: undefined, // Available to all users
  },
  {
    title: "Devices",
    icon: Smartphone,
    id: "devices",
    path: "/pages/devices",
    requiredRole: undefined, // Available to all users
  },
  {
    title: "Gateway",
    icon: Radio,
    id: "gateway",
    path: "/pages/gateway",
    requiredRole: undefined, // Available to all users
  },
  {
    title: "Gateway List",
    icon: List,
    id: "gatewayList",
    path: "/pages/gateway-list",
    requiredRole: undefined, // Available to all users
  },
  {
    title: "Device List",
    icon: List,
    id: "deviceList",
    path: "/pages/device-list",
    requiredRole: undefined, // Available to all users
  },
  {
    title: "Subscription",
    icon: CreditCard,
    id: "subscription",
    path: "/pages/subscription",
    requiredRole: undefined, // Available to all users
  },
  {
    title: "Subscription Management",
    icon: Shield,
    id: "subscriptionManagement",
    path: "/pages/subscription-management",
    requiredRole: "admin", // Admin only
  },
  {
    title: "Users Management",
    icon: Users,
    id: "usersManagement",
    path: "/pages/users",
    requiredRole: undefined, // Available to all users
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

  // Filter navigation items based on user role
  const filteredNavigationItems = navigationItems.filter((item) => {
    // If no requiredRole is specified, show to all users
    if (!item.requiredRole) {
      return true;
    }
    
    const userRole = user?.role?.toLowerCase();
    
    // SuperAdmin has access to everything
    if (userRole === "superadmin") {
      return true;
    }
    
    // Admin items are accessible to both admin and SuperAdmin
    if (item.requiredRole === "admin") {
      return userRole === "admin" || userRole === "superadmin";
    }
    
    // If requiredRole is specified, check if user has that role (case-insensitive)
    return userRole === item.requiredRole?.toLowerCase();
  });

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
              {filteredNavigationItems.map((item) => (
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
          <Button 
            className="w-full cursor-pointer justify-start gap-2 text-red-600 hover:text-white hover:bg-red-600 dark:text-red-400 dark:hover:text-white dark:hover:bg-red-600 transition-colors" 
            variant="ghost" 
            size="default" 
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>   
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
