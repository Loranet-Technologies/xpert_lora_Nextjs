"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  DASHBOARD_SUMMARY_QUERY_KEY,
  getDashboardSummary,
  type DashboardSummaryResponse,
} from "@/lib/api/dashboard/dashboard";
import {
  isProductAccessSuspendedFromSummary,
  isSubscriptionRecoveryPath,
} from "@/lib/subscription/subscription-enforcement";

const DEV_MODE =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_DEV_MODE === "true";

type SubscriptionAccessContextValue = {
  summary: DashboardSummaryResponse | undefined;
  isProductSuspended: boolean;
  isLoading: boolean;
  refetchAccess: () => void;
};

const SubscriptionAccessContext = createContext<
  SubscriptionAccessContextValue | undefined
>(undefined);

export function SubscriptionAccessProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const enabled =
    isAuthenticated && !authLoading && !DEV_MODE;

  const summaryQuery = useQuery({
    queryKey: DASHBOARD_SUMMARY_QUERY_KEY,
    queryFn: () => getDashboardSummary(),
    enabled,
    staleTime: 60_000,
    retry: 1,
  });

  const isProductSuspended = useMemo(() => {
    if (DEV_MODE) return false;
    return isProductAccessSuspendedFromSummary(summaryQuery.data);
  }, [summaryQuery.data]);

  const refetchAccess = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_QUERY_KEY });
  }, [queryClient]);

  const value = useMemo<SubscriptionAccessContextValue>(
    () => ({
      summary: summaryQuery.data,
      isProductSuspended,
      isLoading: enabled ? summaryQuery.isLoading : false,
      refetchAccess,
    }),
    [
      summaryQuery.data,
      summaryQuery.isLoading,
      isProductSuspended,
      enabled,
      refetchAccess,
    ],
  );

  return (
    <SubscriptionAccessContext.Provider value={value}>
      {children}
    </SubscriptionAccessContext.Provider>
  );
}

export function useSubscriptionAccess(): SubscriptionAccessContextValue {
  const ctx = useContext(SubscriptionAccessContext);
  if (!ctx) {
    throw new Error(
      "useSubscriptionAccess must be used within SubscriptionAccessProvider",
    );
  }
  return ctx;
}

/**
 * Redirects authenticated users away from product routes when subscription is suspended.
 */
export function SubscriptionAccessGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isProductSuspended, isLoading: accessLoading } =
    useSubscriptionAccess();

  useEffect(() => {
    if (DEV_MODE) return;
    if (authLoading || !isAuthenticated) return;
    if (accessLoading) return;
    if (!isProductSuspended) return;
    if (isSubscriptionRecoveryPath(pathname)) return;
    router.replace("/pages/subscription?suspended=1");
  }, [
    pathname,
    router,
    isAuthenticated,
    authLoading,
    accessLoading,
    isProductSuspended,
  ]);

  if (
    !DEV_MODE &&
    isAuthenticated &&
    !authLoading &&
    !accessLoading &&
    isProductSuspended &&
    !isSubscriptionRecoveryPath(pathname)
  ) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 p-8 text-muted-foreground text-sm">
        <p>Redirecting to subscription…</p>
      </div>
    );
  }

  return <>{children}</>;
}
