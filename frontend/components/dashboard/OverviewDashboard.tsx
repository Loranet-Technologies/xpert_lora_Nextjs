"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Bell, CheckCircle2, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSubscriptionAccess } from "@/components/subscription/SubscriptionAccessProvider";
import type { AlertItem } from "@/components/header";
import {
  DASHBOARD_SUMMARY_QUERY_KEY,
  getDashboardNotifications,
  getDashboardSummary,
} from "@/lib/api/dashboard/dashboard";

function formatDate(dateValue?: string | null): string {
  if (!dateValue) return "N/A";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString();
}

function formatMoney(value: number, currency?: string | null): string {
  if (!currency) return `${value.toFixed(2)}`;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function getStatusBadgeVariant(
  status?: string | null,
): "default" | "secondary" | "destructive" {
  const s = (status || "").toLowerCase();
  if (s === "active" || s === "paid" || s === "completed" || s === "success") {
    return "default";
  }
  if (
    s === "suspended" ||
    s === "unpaid" ||
    s === "failed" ||
    s === "cancelled"
  ) {
    return "destructive";
  }
  return "secondary";
}

export function OverviewDashboard({
  onAlertsChange,
}: {
  onAlertsChange?: (alerts: AlertItem[]) => void;
}) {
  const { isProductSuspended, isLoading: subscriptionAccessLoading } =
    useSubscriptionAccess();

  const summaryQuery = useQuery({
    queryKey: DASHBOARD_SUMMARY_QUERY_KEY,
    queryFn: () => getDashboardSummary(),
    retry: 1,
  });

  const notificationsQuery = useQuery({
    queryKey: ["dashboard-notifications"],
    queryFn: () => getDashboardNotifications({ days_ahead: 7 }),
    retry: 1,
  });

  const isLoading = summaryQuery.isLoading || notificationsQuery.isLoading;
  const hasError = summaryQuery.isError || notificationsQuery.isError;
  const errorMessage =
    (summaryQuery.error as Error | undefined)?.message ||
    (notificationsQuery.error as Error | undefined)?.message ||
    "Failed to load dashboard";

  const summary = summaryQuery.data;
  const notifications = useMemo(
    () => notificationsQuery.data?.notifications ?? [],
    [notificationsQuery.data],
  );
  const usage = summary?.usage;
  const subscription = summary?.subscription;
  const payment = summary?.payment;

  const headerAlerts: AlertItem[] = useMemo(
    () =>
      notifications.map((item, index) => ({
        id: `${item.code || item.title}-${index}`,
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
      })),
    [notifications],
  );

  useEffect(() => {
    onAlertsChange?.(headerAlerts);
  }, [headerAlerts, onAlertsChange]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      {!subscriptionAccessLoading && isProductSuspended && (
        <Alert variant="destructive" className="border-destructive/80">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Account on hold — LoRaWAN features stay paused until you complete
              payment.
            </span>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/pages/subscription">Go to Subscription</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">
            Loading dashboard...
          </span>
        </div>
      )}

      {hasError && (
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="text-red-600">Dashboard Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button
              variant="outline"
              onClick={() => {
                summaryQuery.refetch();
                notificationsQuery.refetch();
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !hasError && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={getStatusBadgeVariant(summary?.account_status)}>
                  {summary?.account_status || "Pending"}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Organization: {summary?.organization || "N/A"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Subscription Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-base font-semibold">
                  {subscription?.plan_name || "No plan"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Status: {subscription?.status || "N/A"} | Interval:{" "}
                  {subscription?.billing_interval || "N/A"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={getStatusBadgeVariant(payment?.status)}>
                  {payment?.status || "No Payment"}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Outstanding:{" "}
                  {formatMoney(
                    payment?.outstanding_amount || 0,
                    payment?.currency,
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{notifications.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active alerts and info
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage & Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded border p-2">
                  <span className="text-sm">Devices</span>
                  <span className="text-sm font-medium">
                    {usage?.devices_used ?? 0}/{usage?.device_limit ?? "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded border p-2">
                  <span className="text-sm">Messages</span>
                  <span className="text-sm font-medium">
                    {usage?.messages_used ?? 0}/{usage?.messages_limit ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded border p-2">
                  <span className="text-sm">Data</span>
                  <span className="text-sm font-medium">
                    {(usage?.data_used_mb ?? 0).toFixed(2)} MB/
                    {(usage?.data_limit_mb ?? 0).toFixed(2)} MB
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded border p-2">
                  <span className="text-sm">Subscription Start</span>
                  <span className="text-sm font-medium">
                    {formatDate(subscription?.start_date)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded border p-2">
                  <span className="text-sm">Subscription End</span>
                  <span className="text-sm font-medium">
                    {formatDate(subscription?.end_date)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded border p-2">
                  <span className="text-sm">Last Payment Date</span>
                  <span className="text-sm font-medium">
                    {formatDate(payment?.last_payment_date)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                System Notifications & Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.length === 0 ? (
                <div className="flex items-center gap-2 rounded border p-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  No alerts. Everything looks good.
                </div>
              ) : (
                notifications.map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    className="flex items-start justify-between rounded border p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.message}
                      </p>
                    </div>
                    <Badge
                      variant={
                        item.type === "error"
                          ? "destructive"
                          : item.type === "warning"
                            ? "secondary"
                            : "default"
                      }
                      className="capitalize"
                    >
                      {item.type}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
