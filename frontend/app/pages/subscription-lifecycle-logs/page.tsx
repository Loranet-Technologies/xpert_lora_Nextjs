"use client";

import { useMemo, useState } from "react";
import { format as formatDate } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  getPaymentBillingLogs,
  type PaymentBillingLogRow,
} from "@/lib/api/payment/payment-billing-logs";
import { Loader2 } from "lucide-react";

type SubscriptionLifecycleEvent =
  | "subscription.created"
  | "subscription.plan_changed"
  | "subscription.renewed"
  | "subscription.cancelled"
  | "subscription.expired";

const SUPPORTED_EVENTS: SubscriptionLifecycleEvent[] = [
  "subscription.created",
  "subscription.plan_changed",
  "subscription.renewed",
  "subscription.cancelled",
  "subscription.expired",
];

type PlanDetails = {
  plan?: string | null;
  plan_name?: string | null;
  price?: number | null;
  currency?: string | null;
};

function parsePayload(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function getPlanDetails(row: PaymentBillingLogRow): PlanDetails {
  const payload = parsePayload(row.gateway_response);

  const planDetails = payload.plan_details as PlanDetails | undefined;
  const newPlanDetails = payload.new_plan_details as PlanDetails | undefined;

  if (row.event_type === "subscription.plan_changed" && newPlanDetails) {
    return newPlanDetails;
  }
  return planDetails ?? newPlanDetails ?? {};
}

function formatMoney(amount?: number | null, currency?: string | null) {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${amount} ${currency || "USD"}`;
  }
}

function eventBadgeClass(eventType?: string | null) {
  switch (eventType) {
    case "subscription.created":
      return "border-blue-200 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200";
    case "subscription.plan_changed":
      return "border-violet-200 bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200";
    case "subscription.renewed":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200";
    case "subscription.cancelled":
      return "border-red-200 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200";
    case "subscription.expired":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200";
    default:
      return "";
  }
}

export default function SubscriptionLifecycleLogsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [eventFilter, setEventFilter] = useState<"all" | SubscriptionLifecycleEvent>(
    "all",
  );

  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ["subscription-lifecycle-logs"],
    queryFn: () =>
      getPaymentBillingLogs({
        limit: 200,
        start: 0,
        include_payload: true,
      }),
    enabled: isAuthenticated,
  });

  const rows = useMemo(() => {
    const base = (data?.data ?? []).filter((row) => {
      if (row.reference_doctype !== "Subscription") return false;
      return (
        typeof row.event_type === "string" &&
        SUPPORTED_EVENTS.includes(row.event_type as SubscriptionLifecycleEvent)
      );
    });

    if (eventFilter === "all") return base;
    return base.filter((row) => row.event_type === eventFilter);
  }, [data?.data, eventFilter]);

  if (authLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header title="Subscription lifecycle logs" />
          <div className="flex flex-1 items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header title="Subscription lifecycle logs" />
          <div className="flex flex-1 flex-col gap-4 p-6">
            <p className="text-sm text-muted-foreground">
              Please sign in to view subscription lifecycle logs.
            </p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header title="Subscription lifecycle logs" />
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="mx-auto w-full max-w-[1600px] space-y-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Subscription lifecycle logging
              </h1>
              <p className="text-sm text-muted-foreground">
                Audit billing lifecycle events for subscription creation, plan
                changes, renewals, cancellations, and expiry with plan and
                pricing snapshots.
              </p>
            </div>

            <Card className="border-0 overflow-hidden">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={eventFilter === "all" ? "default" : "outline"}
                    onClick={() => setEventFilter("all")}
                  >
                    All events
                  </Button>
                  {SUPPORTED_EVENTS.map((evt) => (
                    <Button
                      key={evt}
                      type="button"
                      size="sm"
                      variant={eventFilter === evt ? "default" : "outline"}
                      onClick={() => setEventFilter(evt)}
                    >
                      {evt}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isFetching}
                    onClick={() => refetch()}
                  >
                    Refresh
                  </Button>
                </div>

                {error && (
                  <p className="text-sm text-destructive">
                    {error instanceof Error
                      ? error.message
                      : "Failed to load subscription lifecycle logs"}
                  </p>
                )}

                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Time
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Event
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Subscription
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Plan
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Price
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Status
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium">
                          Organization
                        </th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {isLoading ? (
                        <tr className="border-b">
                          <td className="p-4 align-middle text-center" colSpan={7}>
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                          </td>
                        </tr>
                      ) : rows.length === 0 ? (
                        <tr className="border-b">
                          <td
                            className="p-4 align-middle text-center text-muted-foreground"
                            colSpan={7}
                          >
                            No subscription lifecycle logs found.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row) => {
                          const plan = getPlanDetails(row);
                          return (
                            <tr
                              key={row.name}
                              className="border-b transition-colors hover:bg-muted/50"
                            >
                              <td className="p-4 align-middle whitespace-nowrap text-xs font-mono">
                                {row.creation
                                  ? formatDate(
                                      new Date(row.creation),
                                      "yyyy-MM-dd HH:mm",
                                    )
                                  : "—"}
                              </td>
                              <td className="p-4 align-middle">
                                <Badge
                                  variant="outline"
                                  className={eventBadgeClass(row.event_type)}
                                >
                                  {row.event_type || "—"}
                                </Badge>
                              </td>
                              <td
                                className="p-4 align-middle max-w-[220px] truncate"
                                title={row.reference_name || undefined}
                              >
                                {row.reference_name || "—"}
                              </td>
                              <td
                                className="p-4 align-middle max-w-[240px] truncate"
                                title={
                                  plan.plan_name ||
                                  plan.plan ||
                                  row.gateway_event ||
                                  undefined
                                }
                              >
                                {plan.plan_name || plan.plan || "—"}
                              </td>
                              <td className="p-4 align-middle whitespace-nowrap tabular-nums">
                                {formatMoney(plan.price ?? row.amount, plan.currency ?? row.currency)}
                              </td>
                              <td className="p-4 align-middle">
                                <Badge variant="secondary">
                                  {row.status || "—"}
                                </Badge>
                              </td>
                              <td
                                className="p-4 align-middle max-w-[180px] truncate"
                                title={row.organization || undefined}
                              >
                                {row.organization || "—"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
