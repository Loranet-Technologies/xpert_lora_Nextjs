'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ChevronRight, Moon, Sun } from "lucide-react";
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/lib/auth/AuthProvider';

interface props {
  title?: string;
}

const Header = ({ title }: props) => {
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

        {/* User Info and Dark Mode Toggle - Right Side */}
        {isMounted && (
          <div className="ml-auto flex items-center gap-3" suppressHydrationWarning>
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