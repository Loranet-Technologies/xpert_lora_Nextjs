"use client";

import * as React from "react";
import {
  Building2,
  ClipboardList,
  Settings,
  SlidersHorizontal,
  Smartphone,
  Radio,
  LogOut,
  List,
  LayoutDashboard,
  CreditCard,
  Shield,
  Users,
  Store,
  BarChart3,
  ScrollText,
  Receipt,
  FileClock,
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
import { useSubscriptionAccess } from "@/components/subscription/SubscriptionAccessProvider";
import { useNavigation } from "@/components/customHooks/useNavigation";
import { mapPathToTab } from "@/utils/mapPathToTab";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// This is the data for the navigation items
// Add 'requiredRole' property to restrict items to specific roles
// If not specified, the item is visible to all users
const navigationItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    id: "dashboard",
    path: "/dashboard",
    requiredRole: undefined, // Available to all users
    requiresActiveSubscription: false,
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
    title: "Gateways",
    icon: Radio,
    id: "gateways",
    path: "/pages/gateways",
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
    requiresActiveSubscription: false,
  },
  {
    title: "Subscription Dashboard",
    icon: BarChart3,
    id: "subscriptionDashboard",
    path: "/pages/subscription-dashboard",
    requiredRole: "admin",
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
    requiredRole: "admin", // Admin only
  },
  {
    title: "Activity logs",
    icon: ScrollText,
    id: "activityLogs",
    path: "/pages/activity-logs",
    requiredRole: undefined, // Available to all authenticated users
  },
  {
    title: "Subscription lifecycle logs",
    icon: FileClock,
    id: "subscriptionLifecycleLogs",
    path: "/pages/subscription-lifecycle-logs",
    requiredRole: "admin",
  },
  {
    title: "Payment & billing logs",
    icon: Receipt,
    id: "paymentBillingLogs",
    path: "/pages/payment-billing-logs",
    requiredRole: undefined, // Admin only
  },
  {
    title: "Merchant Management",
    icon: Store,
    id: "merchants",
    path: "/pages/merchants",
    requiredRole: "admin", // Admin only
  },
  {
    title: "Settings",
    icon: SlidersHorizontal,
    id: "settings",
    path: "/pages/settings",
    requiredRole: undefined, // Available to all users
    requiresActiveSubscription: false,
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
  const { isProductSuspended, isLoading: subscriptionAccessLoading } =
    useSubscriptionAccess();
  const router = useRouter();
  const pathname = usePathname();
  const { activeTab: hookActiveTab, setActiveTabState } = useNavigation();

  // Use prop values if provided, otherwise use hook values
  const activeTab = propActiveTab ?? hookActiveTab;
  const setActiveTab = propSetActiveTab ?? setActiveTabState;

  const isPathActive = React.useCallback(
    (itemPath: string) => {
      if (!pathname) return false;
      if (pathname === "/" && itemPath === "/pages/dashboard") return true;
      return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
    },
    [pathname],
  );

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

    // SuperAdmin has access to everything (role is compared lowercase)
    if (userRole === "superadmin") {
      return true;
    }

    // Admin items are accessible to both admin and SuperAdmin
    if (item.requiredRole?.toLowerCase() === "admin") {
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
              {filteredNavigationItems.map((item) => {
                const navItem = item as (typeof navigationItems)[number];
                const requiresSub =
                  navItem.requiresActiveSubscription !== false;
                const locked =
                  isProductSuspended &&
                  !subscriptionAccessLoading &&
                  requiresSub;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      tooltip={
                        locked
                          ? "Account on hold — open Subscription to complete payment and restore access."
                          : item.title
                      }
                      isActive={
                        isPathActive(item.path) || activeTab === item.id
                      }
                      disabled={locked}
                      className={locked ? "opacity-50" : undefined}
                      onClick={() => {
                        if (locked) return;
                        handleNavigation(item.path, item.id);
                      }}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              className="w-full cursor-pointer justify-start gap-2 text-red-600 hover:text-white hover:bg-red-600 dark:text-red-400 dark:hover:text-white dark:hover:bg-red-600 transition-colors"
              variant="ghost"
              size="default"
              title="Logout"
              type="button"
            >
              <LogOut className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">
                Logout
              </span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Log out</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to logout?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel autoFocus>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                onClick={() => void logout()}
              >
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
