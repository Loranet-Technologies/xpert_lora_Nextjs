'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ChevronRight, Moon, Sun, Bell, AlertCircle } from "lucide-react";
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type AlertItem = {
  id: string | number;
  type?: string;
  message: string;
  severity: "error" | "warning" | "info";
};

interface HeaderProps {
  title?: string;
  /** Optional alerts to show in the bell dropdown. If not provided, default mock alerts are used. */
  alerts?: AlertItem[];
}

const defaultAlerts: AlertItem[] = [
  { id: 1, type: "failed_payment", message: "2 failed payments in the last 24 hours", severity: "error" },
  { id: 2, type: "expiring", message: "8 subscriptions expiring in the next 7 days", severity: "warning" },
  { id: 3, type: "trial", message: "12 trials ending in the next 3 days", severity: "info" },
];

const Header = ({ title, alerts = defaultAlerts }: HeaderProps) => {
  const pathname = usePathname();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, isLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  
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
                  {alerts.length > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                      {alerts.length > 9 ? "9+" : alerts.length}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
                <div className="border-b px-3 py-2">
                  <p className="font-semibold text-sm">Alerts & Notifications</p>
                  <p className="text-xs text-muted-foreground">Operational alerts</p>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No new alerts
                    </div>
                  ) : (
                    alerts.map((a) => (
                      <div
                        key={a.id}
                        className={cn(
                          "flex gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50",
                          a.severity === "error" && "border-l-2 border-l-destructive bg-destructive/5",
                          a.severity === "warning" && "border-l-2 border-l-amber-500 bg-amber-500/5",
                          a.severity === "info" && "border-l-2 border-l-blue-500 bg-blue-500/5"
                        )}
                      >
                        <AlertCircle className={cn(
                          "h-4 w-4 shrink-0 mt-0.5",
                          a.severity === "error" && "text-destructive",
                          a.severity === "warning" && "text-amber-600 dark:text-amber-500",
                          a.severity === "info" && "text-blue-600 dark:text-blue-400"
                        )} />
                        <p className="flex-1">{a.message}</p>
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
  );
};

export default Header;