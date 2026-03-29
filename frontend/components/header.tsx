'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ChevronRight, Moon, Sun, Bell, AlertCircle } from "lucide-react";
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useSubscriptionAccess } from "@/components/subscription/SubscriptionAccessProvider";
import { useQuery } from "@tanstack/react-query";
import { getDashboardNotifications } from "@/lib/api/dashboard/dashboard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type AlertItem = {
  id: string | number;
  type?: string;
  title?: string;
  code?: string;
  message: string;
  severity: "error" | "warning" | "info";
};

interface HeaderProps {
  title?: string;
  /** Optional alerts to show in the bell dropdown. */
  alerts?: AlertItem[];
}
const Header = ({ title, alerts }: HeaderProps) => {
  const pathname = usePathname();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { isProductSuspended, isLoading: subscriptionAccessLoading } =
    useSubscriptionAccess();
  const showSuspendedBanner =
    isAuthenticated &&
    isProductSuspended &&
    !subscriptionAccessLoading &&
    !pathname.startsWith("/pages/subscription");
  const [isMounted, setIsMounted] = useState(false);
  const [readAlerts, setReadAlerts] = useState<Record<string, boolean>>({});
  
  // Check if we're inside a SidebarProvider
  let hasSidebar = false;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSidebar();
    hasSidebar = true;
  } catch (e) {
    // Not inside SidebarProvider, that's okay
    hasSidebar = false;
  }

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const notificationsQuery = useQuery({
    queryKey: ["header-dashboard-notifications"],
    queryFn: () => getDashboardNotifications({ days_ahead: 7 }),
    enabled: alerts === undefined,
    retry: 1,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  // Compute user email and initial from auth context
  const { userEmail, userInitial } = useMemo(() => {
    if (!user) {
      return { userEmail: '', userInitial: 'U' };
    }

    const email = user.email || '';
    const fullName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.firstName || user.lastName || user.username || '';
    
    // Get initial from full name, first name, last name, username, or email
    let initial = 'U';
    if (fullName) {
      initial = fullName.charAt(0).toUpperCase();
    } else if (user.firstName) {
      initial = user.firstName.charAt(0).toUpperCase();
    } else if (user.lastName) {
      initial = user.lastName.charAt(0).toUpperCase();
    } else if (user.username) {
      initial = user.username.charAt(0).toUpperCase();
    } else if (email) {
      initial = email.charAt(0).toUpperCase();
    }

    return { userEmail: email, userInitial: initial };
  }, [user]);

  const readStorageKey = useMemo(() => {
    const userKey = user?.email || user?.username || "anonymous";
    return `xpert_lora:read_notifications:${userKey}`;
  }, [user?.email, user?.username]);

  useEffect(() => {
    if (!isMounted) return;
    try {
      const raw = window.localStorage.getItem(readStorageKey);
      if (!raw) {
        setReadAlerts({});
        return;
      }
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      if (parsed && typeof parsed === "object") {
        setReadAlerts(parsed);
      } else {
        setReadAlerts({});
      }
    } catch {
      setReadAlerts({});
    }
  }, [isMounted, readStorageKey]);

  useEffect(() => {
    if (!isMounted) return;
    try {
      window.localStorage.setItem(readStorageKey, JSON.stringify(readAlerts));
    } catch {
      // Ignore localStorage write errors
    }
  }, [isMounted, readStorageKey, readAlerts]);

  const resolvedAlerts: AlertItem[] = useMemo(() => {
    if (alerts !== undefined) return alerts;
    const list = notificationsQuery.data?.notifications || [];
    return list.map((item, index) => ({
      id: `${item.code || item.title || "alert"}-${index}`,
      type: item.type,
      title: item.title,
      code: item.code,
      message: item.message,
      severity:
        item.type === "error"
          ? "error"
          : item.type === "warning"
            ? "warning"
            : "info",
    }));
  }, [alerts, notificationsQuery.data]);

  const withIds = useMemo(
    () =>
      resolvedAlerts.map((a, index) => {
        const stableId = String(
          a.id ??
            `${a.code || a.type || "alert"}:${a.title || ""}:${a.message}:${index}`,
        );
        return { ...a, stableId };
      }),
    [resolvedAlerts],
  );

  const unreadCount = useMemo(
    () => withIds.filter((a) => !readAlerts[a.stableId]).length,
    [withIds, readAlerts],
  );

  const markAlertAsRead = (stableId: string) => {
    setReadAlerts((prev) => ({
      ...prev,
      [stableId]: true,
    }));
  };

  const markAllAsRead = () => {
    if (withIds.length === 0) return;
    const next: Record<string, boolean> = {};
    for (const alert of withIds) {
      next[alert.stableId] = true;
    }
    setReadAlerts((prev) => ({
      ...prev,
      ...next,
    }));
  };

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = (): Array<{ label: string; href: string; isLast?: boolean }> => {
    // If title is provided, use it as a single breadcrumb
    if (title) {
      return [{ label: title, href: pathname, isLast: true }];
    }

    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: Array<{ label: string; href: string; isLast?: boolean }> = [];

    let currentPath = '';
    for (let i = 0; i < paths.length; i++) {
      // Skip "pages" segment in breadcrumbs (it's just a routing segment)
      if (paths[i] === 'pages') {
        currentPath += `/${paths[i]}`;
        continue;
      }
      
      currentPath += `/${paths[i]}`;
      
      // Format the label (capitalize first letter, replace hyphens with spaces)
      const label = paths[i]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        href: currentPath,
        isLast: i === paths.length - 1,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <>
    {showSuspendedBanner && (
      <div
        role="status"
        className="flex shrink-0 items-center justify-center gap-2 border-b border-amber-500/35 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-950 dark:text-amber-100"
      >
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
        <span>
          Account on hold — applications, devices, and integrations stay paused
          until you complete payment.
        </span>
        <Link
          href="/pages/subscription"
          className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-50"
        >
          Go to Subscription
        </Link>
      </div>
    )}
    <header 
      className="flex h-14 shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear"
      suppressHydrationWarning
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {/* Only show SidebarTrigger if inside SidebarProvider */}
        {hasSidebar && (
          <>
            <SidebarTrigger className="-ml-1" />
          </>
        )}
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 bg-border"
        />
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              {crumb.isLast ? (
                <span className="font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* User Info, Alerts, Dark Mode - Right Side */}
        {isMounted && (
          <div className="ml-auto flex items-center gap-2" suppressHydrationWarning>
            {/* Alerts dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  aria-label="Alerts and notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
                <div className="border-b px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">Alerts & Notifications</p>
                      <p className="text-xs text-muted-foreground">Operational alerts</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                    >
                      Mark all as read
                    </Button>
                  </div>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {notificationsQuery.isLoading && alerts === undefined ? (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      Loading notifications...
                    </div>
                  ) : withIds.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No new alerts
                    </div>
                  ) : (
                    withIds.map((a) => (
                      <div
                        key={a.stableId}
                        onClick={() => markAlertAsRead(a.stableId)}
                        className={cn(
                          "flex cursor-pointer gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50",
                          a.severity === "error" && "border-l-2 border-l-destructive bg-destructive/5",
                          a.severity === "warning" && "border-l-2 border-l-amber-500 bg-amber-500/5",
                          a.severity === "info" && "border-l-2 border-l-blue-500 bg-blue-500/5",
                          readAlerts[a.stableId] && "opacity-60"
                        )}
                      >
                        <AlertCircle className={cn(
                          "h-4 w-4 shrink-0 mt-0.5",
                          a.severity === "error" && "text-destructive",
                          a.severity === "warning" && "text-amber-600 dark:text-amber-500",
                          a.severity === "info" && "text-blue-600 dark:text-blue-400"
                        )} />
                        <div className="flex-1">
                          {a.title ? (
                            <p className="font-medium leading-5">{a.title}</p>
                          ) : null}
                          <p className={cn("leading-5", a.title && "text-muted-foreground")}>
                            {a.message}
                          </p>
                          {a.code ? (
                            <p className="mt-0.5 text-[11px] uppercase text-muted-foreground">
                              {a.code.replaceAll("_", " ")}
                            </p>
                          ) : null}
                        </div>
                        {!readAlerts[a.stableId] ? (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Dark Mode Toggle */}
            <div
              className="text-muted-foreground hover:text-foreground transition-colors duration-300 cursor-pointer"
              onClick={toggleTheme}
              title={isMounted && isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              suppressHydrationWarning>
              {isMounted ? (
                isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </div>
            {!isLoading && (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline-block">
                  {userEmail || user?.username || user?.firstName || 'User'}
                </span>
                <div 
                  className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center transition-colors duration-200"
                  suppressHydrationWarning
                >
                  <span className="text-white text-sm font-medium">
                    {userInitial}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
    </>
  );
};

export default Header;