"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header, { type AlertItem } from "@/components/header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  Users,
  UserPlus,
  UserMinus,
  Clock,
  Percent,
  CreditCard,
  AlertCircle,
  Activity,
  Database,
  Zap,
  Loader2,
} from "lucide-react";
import "chart.js/auto";
import { Line, Bar, Pie } from "react-chartjs-2";
import { getSubscriptionDashboard } from "@/lib/api/subscription/subscription";

// Fallback hex colors when CSS vars can't be resolved (e.g. SSR or canvas)
const FALLBACK_CHART_COLORS = [
  "#f05100",
  "#009588",
  "#104e64",
  "#fcbb00",
  "#f99c00",
  "#7c3aed",
  "#0d9488",
  "#d97706",
  "#be185d",
  "#0284c7",
];

function getComputedCssVar(name: string): string {
  if (typeof document === "undefined") return "";
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (value) return value;
  return "";
}

/** Resolve theme CSS variables to real color strings for Chart.js (canvas doesn't resolve var()). */
function useResolvedChartColors() {
  const [colors, setColors] = useState<{
    chart: string[];
    card: string;
    border: string;
    foreground: string;
    mutedForeground: string;
    muted: string;
    destructive: string;
    background: string;
  }>(() => ({
    chart: FALLBACK_CHART_COLORS,
    card: "hsl(0 0% 100%)",
    border: "hsl(214 32% 91%)",
    foreground: "hsl(222 47% 11%)",
    mutedForeground: "hsl(215 16% 47%)",
    muted: "hsl(214 32% 91%)",
    destructive: "hsl(0 84% 60%)",
    background: "hsl(0 0% 100%)",
  }));

  useEffect(() => {
    const raw = (name: string) => getComputedCssVar(name).trim();
    const chart1 = raw("--chart-1");
    const chart2 = raw("--chart-2");
    const chart3 = raw("--chart-3");
    const chart4 = raw("--chart-4");
    const chart5 = raw("--chart-5");
    const chartColors = [
      chart1 || FALLBACK_CHART_COLORS[0],
      chart2 || FALLBACK_CHART_COLORS[1],
      chart3 || FALLBACK_CHART_COLORS[2],
      chart4 || FALLBACK_CHART_COLORS[3],
      chart5 || FALLBACK_CHART_COLORS[4],
      FALLBACK_CHART_COLORS[5],
      FALLBACK_CHART_COLORS[6],
      FALLBACK_CHART_COLORS[7],
      FALLBACK_CHART_COLORS[8],
      FALLBACK_CHART_COLORS[9],
    ];
    const card = raw("--card");
    const border = raw("--border");
    const fg = raw("--foreground");
    const mutedFg = raw("--muted-foreground");
    const muted = raw("--muted");
    const destructive = raw("--destructive");
    const bg = raw("--background");
    const toColor = (v: string, fallback: string) => (v ? (v.startsWith("oklch") || v.startsWith("hsl") || v.startsWith("#") ? v : `hsl(${v})`) : fallback);
    setColors({
      chart: chartColors,
      card: toColor(card, "hsl(0 0% 100%)"),
      border: toColor(border, "hsl(214 32% 91%)"),
      foreground: toColor(fg, "hsl(222 47% 11%)"),
      mutedForeground: toColor(mutedFg, "hsl(215 16% 47%)"),
      muted: toColor(muted, "hsl(214 32% 91%)"),
      destructive: toColor(destructive, "hsl(0 84% 60%)"),
      background: toColor(bg, "hsl(0 0% 100%)"),
    });
  }, []);

  return colors;
}

// ─── KPI Stat Card ─────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            {trend === "up" && (
              <TrendingUp className="h-3 w-3 text-emerald-600" />
            )}
            <span
              className={`text-xs ${
                trend === "up"
                  ? "text-emerald-600"
                  : trend === "down"
                    ? "text-red-600"
                    : "text-muted-foreground"
              }`}
            >
              vs last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function SubscriptionDashboardPage() {
  const [dashboardData, setDashboardData] = useState<Awaited<ReturnType<typeof getSubscriptionDashboard>>["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resolvedColors = useResolvedChartColors();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getSubscriptionDashboard({ months: 12, top_customers_limit: 10, days_ahead: 30 })
      .then((res) => {
        if (!cancelled && res.success && res.data) setDashboardData(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const d = dashboardData;

  const kpiSummary = useMemo(() => {
    if (!d?.kpis) {
      return {
        monthlyRevenue: 0,
        mrr: 0,
        activeSubscriptions: 0,
        newSubscriptions: 0,
        churnRate: 0,
        trialUsers: 0,
        conversionRate: 0,
      };
    }
    const k = d.kpis;
    return {
      monthlyRevenue: k.monthly_revenue ?? 0,
      mrr: k.mrr ?? 0,
      activeSubscriptions: k.active_subscriptions ?? 0,
      newSubscriptions: k.new_subscriptions_this_month ?? 0,
      churnRate: k.churn_rate ?? 0,
      trialUsers: k.trial_users ?? 0,
      conversionRate: k.trial_conversion_rate ?? 0,
    };
  }, [d?.kpis]);

  const revenueTrendData = useMemo(() => {
    const byMonth = d?.revenue_analytics?.revenue_by_month ?? [];
    const mrrByMonth = (d?.revenue_analytics?.mrr_by_month ?? []) as Array<{ month: string; mrr: number }>;
    const map = new Map<string, { month: string; revenue: number; mrr: number }>();
    byMonth.forEach((r) => map.set(r.month, { month: r.month, revenue: r.revenue ?? 0, mrr: 0 }));
    mrrByMonth.forEach((m) => {
      const existing = map.get(m.month);
      if (existing) existing.mrr = m.mrr ?? 0;
      else map.set(m.month, { month: m.month, revenue: 0, mrr: m.mrr ?? 0 });
    });
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [d?.revenue_analytics]);

  const revenueByPlanData = useMemo(() => {
    const byPlan = d?.revenue_analytics?.revenue_by_plan ?? [];
    const chart = resolvedColors.chart;
    return byPlan.map((p, i) => ({
      name: p.plan || "Other",
      value: p.revenue ?? 0,
      color: chart[i % chart.length],
    }));
  }, [d?.revenue_analytics?.revenue_by_plan, resolvedColors.chart]);

  const subscriptionMetrics = useMemo(() => {
    if (!d?.subscription_metrics) {
      return { active: 0, newLast30: 0, cancelledLast30: 0, expiringSoon: 0, trialConversionRate: 0 };
    }
    const m = d.subscription_metrics;
    return {
      active: m.active_subscriptions ?? 0,
      newLast30: m.new_subscriptions_30d ?? 0,
      cancelledLast30: m.cancelled_subscriptions_30d ?? 0,
      expiringSoon: m.expiring_soon ?? 0,
      trialConversionRate: m.trial_conversion_rate ?? 0,
    };
  }, [d?.subscription_metrics]);

  const customerGrowthData = useMemo(() => {
    const total = d?.customer_insights?.total_customers ?? 0;
    const new7d = d?.customer_insights?.new_customers_7d ?? 0;
    if (total === 0 && new7d === 0) return [{ week: "Week 1", customers: 0 }, { week: "Week 2", customers: 0 }, { week: "Week 3", customers: 0 }, { week: "Week 4", customers: 0 }];
    const w4 = total;
    const w3 = Math.max(0, total - new7d);
    const w2 = Math.max(0, w3 - new7d);
    const w1 = Math.max(0, w2 - new7d);
    return [
      { week: "Week 1", customers: w1 },
      { week: "Week 2", customers: w2 },
      { week: "Week 3", customers: w3 },
      { week: "Week 4", customers: w4 },
    ];
  }, [d?.customer_insights?.total_customers, d?.customer_insights?.new_customers_7d]);

  const topCustomers = useMemo(() => {
    const list = d?.customer_insights?.top_customers ?? [];
    return list.map((c) => ({
      name: c.customer_name ?? c.customer ?? "—",
      plan: c.plan ?? "—",
      monthlySpend: typeof c.monthly_spend === "number" ? `RM ${c.monthly_spend.toLocaleString()}` : "—",
    }));
  }, [d?.customer_insights?.top_customers]);

  const paymentMetrics = useMemo(() => {
    const pb = d?.payment_billing_status;
    if (!pb) {
      return { successfulPayments: 0, failedPayments: 0, outstandingInvoices: 0, refundsIssued: 0 };
    }
    return {
      successfulPayments: pb.successful_payments_count ?? 0,
      failedPayments: pb.failed_payments_count ?? 0,
      outstandingInvoices: pb.outstanding_invoices_count ?? 0,
      refundsIssued: pb.refunds_issued_count ?? 0,
    };
  }, [d?.payment_billing_status]);

  const outstandingInvoices = useMemo(() => {
    const list = d?.payment_billing_status?.outstanding_invoices ?? [];
    return list.map((inv) => ({
      id: inv.name ?? "—",
      customer: inv.customer ?? "—",
      amount: typeof inv.outstanding_amount === "number" ? `RM ${inv.outstanding_amount.toLocaleString()}` : "—",
      due: inv.posting_date ?? "—",
    }));
  }, [d?.payment_billing_status?.outstanding_invoices]);

  const planPerformance = useMemo(() => {
    return (d?.plan_performance ?? []) as Array<{ plan: string; subscribers: number; revenue: number }>;
  }, [d?.plan_performance]);

  const planPieData = useMemo(() => {
    const chart = resolvedColors.chart;
    return planPerformance.map((row, i) => ({
      name: row.plan,
      value: row.subscribers ?? 0,
      color: chart[i % chart.length],
    }));
  }, [planPerformance, resolvedColors.chart]);

  const churnTrendData = useMemo(() => {
    const trend = (d?.churn_analysis?.churn_trend ?? []) as Array<{ month: string; churn_rate: number }>;
    return trend.map((t) => ({
      month: t.month,
      churnRate: t.churn_rate ?? 0,
      retention: 100 - (t.churn_rate ?? 0),
    }));
  }, [d?.churn_analysis?.churn_trend]);

  const systemUsage = useMemo(() => ({
    activeUsersToday: 0,
    apiCalls: 0,
    storageUsage: "—",
  }), []);

  const alerts = useMemo((): AlertItem[] => {
    const a = d?.alerts;
    if (!a) return [];
    const items: AlertItem[] = [];
    const failed = a.failed_payments?.length ?? 0;
    if (failed > 0) items.push({ id: "failed", type: "failed_payment", message: `${failed} failed payment(s). Review and retry or contact customers.`, severity: "error" });
    const expiring = a.subscriptions_expiring_soon?.length ?? 0;
    if (expiring > 0) items.push({ id: "expiring", type: "expiring", message: `${expiring} subscription(s) expiring soon.`, severity: "warning" });
    const trials = a.trials_ending_soon?.length ?? 0;
    if (trials > 0) items.push({ id: "trial", type: "trial", message: `${trials} trial(s) ending soon.`, severity: "info" });
    return items;
  }, [d?.alerts]);

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header alerts={[]} />
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading subscription dashboard…</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header alerts={[]} />
          <div className="flex flex-1 flex-col gap-4 p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Dashboard error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header alerts={alerts} />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="mx-auto w-full max-w-7xl space-y-8">
            {/* Page title */}
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Subscription Service Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Real-time insights into revenue, subscriptions, and customer
                analytics.
              </p>
            </div>

            {/* KPI Summary - always visible */}
            <div>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Key metrics
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
                <StatCard
                  title="Monthly Revenue"
                  value={`RM ${kpiSummary.monthlyRevenue.toLocaleString()}`}
                  subtitle="This month"
                  icon={DollarSign}
                  trend="up"
                />
                <StatCard
                  title="MRR"
                  value={`RM ${kpiSummary.mrr.toLocaleString()}`}
                  subtitle="Recurring revenue"
                  icon={TrendingUp}
                  trend="up"
                />
                <StatCard
                  title="Active Subscriptions"
                  value={kpiSummary.activeSubscriptions}
                  subtitle="Paying"
                  icon={CreditCard}
                />
                <StatCard
                  title="New Subscriptions"
                  value={kpiSummary.newSubscriptions}
                  subtitle="This month"
                  icon={UserPlus}
                  trend="up"
                />
                <StatCard
                  title="Churn Rate"
                  value={`${kpiSummary.churnRate}%`}
                  subtitle="Cancelled"
                  icon={UserMinus}
                  trend="down"
                />
                <StatCard
                  title="Trial Users"
                  value={kpiSummary.trialUsers}
                  subtitle="In trial"
                  icon={Clock}
                />
                <StatCard
                  title="Conversion Rate"
                  value={`${kpiSummary.conversionRate}%`}
                  subtitle="Trial → Paid"
                  icon={Percent}
                  trend="up"
                />
              </div>
            </div>

            <Tabs defaultValue="revenue" className="w-full">
              <TabsList className="inline-flex h-11 w-full flex-wrap items-center justify-start gap-0.5 rounded-xl border bg-card p-1 shadow-sm sm:flex-nowrap">
                <TabsTrigger
                  value="revenue"
                  className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Revenue
                </TabsTrigger>
                <TabsTrigger
                  value="subscriptions"
                  className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Subscriptions
                </TabsTrigger>
                <TabsTrigger
                  value="customers"
                  className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Customers
                </TabsTrigger>
                <TabsTrigger
                  value="billing"
                  className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Billing
                </TabsTrigger>
                <TabsTrigger
                  value="plans"
                  className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Plans & Churn
                </TabsTrigger>
                <TabsTrigger
                  value="system"
                  className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  System
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="revenue"
                className="mt-6 space-y-6 focus-visible:outline-none"
              >
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Revenue analytics</h2>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Revenue growth (monthly)</CardTitle>
                        <CardDescription>Revenue vs MRR trend</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[280px] min-h-[200px] w-full">
                          <Line
                            data={{
                              labels: revenueTrendData.map((d) => d.month),
                              datasets: [
                                {
                                  label: "Revenue",
                                  data: revenueTrendData.map((d) => d.revenue),
                                  borderColor: resolvedColors.chart[0],
                                  backgroundColor: resolvedColors.chart[0].startsWith("#") ? resolvedColors.chart[0] + "20" : resolvedColors.chart[0].replace(")", " / 0.12)"),
                                  fill: true,
                                  tension: 0.3,
                                  pointBackgroundColor: resolvedColors.chart[0],
                                  pointBorderColor: resolvedColors.background,
                                  pointBorderWidth: 2,
                                },
                                {
                                  label: "MRR",
                                  data: revenueTrendData.map((d) => d.mrr),
                                  borderColor: resolvedColors.chart[1],
                                  backgroundColor: resolvedColors.chart[1].startsWith("#") ? resolvedColors.chart[1] + "20" : resolvedColors.chart[1].replace(")", " / 0.12)"),
                                  fill: true,
                                  tension: 0.3,
                                  pointBackgroundColor: resolvedColors.chart[1],
                                  pointBorderColor: resolvedColors.background,
                                  pointBorderWidth: 2,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { labels: { color: resolvedColors.mutedForeground } },
                                tooltip: {
                                  backgroundColor: resolvedColors.card,
                                  borderColor: resolvedColors.border,
                                  borderWidth: 1,
                                  cornerRadius: 8,
                                  titleColor: resolvedColors.foreground,
                                  bodyColor: resolvedColors.foreground,
                                  padding: 12,
                                  callbacks: {
                                    label: (ctx) =>
                                      ` ${ctx.dataset.label}: RM ${Number(ctx.parsed.y).toLocaleString()}`,
                                  },
                                },
                              },
                              scales: {
                                x: { ticks: { color: resolvedColors.mutedForeground }, grid: { color: resolvedColors.muted.startsWith("#") ? resolvedColors.muted + "80" : resolvedColors.muted.replace(")", " / 0.5)") } },
                                y: {
                                  ticks: {
                                    color: resolvedColors.mutedForeground,
                                    callback: (v) => `RM${Number(v) / 1000}k`,
                                  },
                                  grid: { color: resolvedColors.muted.startsWith("#") ? resolvedColors.muted + "80" : resolvedColors.muted.replace(")", " / 0.5)") },
                                },
                              },
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Revenue by subscription plan</CardTitle>
                        <CardDescription>
                          Current month breakdown
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[280px] min-h-[200px] w-full">
                          <Pie
                            data={{
                              labels: revenueByPlanData.map((d) => d.name),
                              datasets: [
                                {
                                  data: revenueByPlanData.map((d) => d.value),
                                  backgroundColor: revenueByPlanData.map((d) => d.color),
                                  borderColor: resolvedColors.card,
                                  borderWidth: 2,
                                  hoverOffset: 4,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { position: "bottom", labels: { color: resolvedColors.mutedForeground, padding: 16 } },
                                tooltip: {
                                  backgroundColor: resolvedColors.card,
                                  borderColor: resolvedColors.border,
                                  borderWidth: 1,
                                  cornerRadius: 8,
                                  padding: 12,
                                  callbacks: {
                                    label: (ctx) => {
                                      const total = (ctx.dataset?.data as number[]).reduce((a, b) => a + b, 0);
                                      const pct = total ? ((Number(ctx.parsed) / total) * 100).toFixed(1) : "0";
                                      return ` ${ctx.label}: RM ${Number(ctx.parsed).toLocaleString()} (${pct}%)`;
                                    },
                                  },
                                },
                              },
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle>MRR trend (bar)</CardTitle>
                      <CardDescription>
                        Monthly recurring revenue
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[260px] min-h-[200px] w-full">
                        <Bar
                          data={{
                            labels: revenueTrendData.map((d) => d.month),
                            datasets: [
                              {
                                label: "MRR",
                                data: revenueTrendData.map((d) => d.mrr),
                                backgroundColor: resolvedColors.chart[1],
                                borderColor: resolvedColors.chart[2],
                                borderWidth: 1,
                                borderRadius: 4,
                              },
                            ],
                          }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false, labels: { color: resolvedColors.mutedForeground } },
                                tooltip: {
                                  backgroundColor: resolvedColors.card,
                                  borderColor: resolvedColors.border,
                                  borderWidth: 1,
                                  cornerRadius: 8,
                                  padding: 12,
                                  callbacks: { label: (ctx) => ` MRR: RM ${Number(ctx.parsed.y).toLocaleString()}` },
                                },
                              },
                              scales: {
                                x: { ticks: { color: resolvedColors.mutedForeground }, grid: { color: resolvedColors.muted.startsWith("#") ? resolvedColors.muted + "80" : resolvedColors.muted.replace(")", " / 0.5)") } },
                                y: {
                                  ticks: {
                                    color: resolvedColors.mutedForeground,
                                    callback: (v) => `RM${Number(v) / 1000}k`,
                                  },
                                  grid: { color: resolvedColors.muted.startsWith("#") ? resolvedColors.muted + "80" : resolvedColors.muted.replace(")", " / 0.5)") },
                                },
                              },
                            }}
                          />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent
                value="subscriptions"
                className="mt-6 space-y-6 focus-visible:outline-none"
              >
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">
                    Subscription metrics
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard
                      title="Active"
                      value={subscriptionMetrics.active}
                      subtitle="Total active"
                      icon={CreditCard}
                    />
                    <StatCard
                      title="New (30 days)"
                      value={subscriptionMetrics.newLast30}
                      subtitle="Created"
                      icon={UserPlus}
                    />
                    <StatCard
                      title="Cancelled (30 days)"
                      value={subscriptionMetrics.cancelledLast30}
                      subtitle="Churned"
                      icon={UserMinus}
                    />
                    <StatCard
                      title="Expiring soon"
                      value={subscriptionMetrics.expiringSoon}
                      subtitle="Next 30 days"
                      icon={Clock}
                    />
                    <StatCard
                      title="Trial conversion"
                      value={`${subscriptionMetrics.trialConversionRate}%`}
                      subtitle="Trial → Paid"
                      icon={Percent}
                    />
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Subscription growth trend</CardTitle>
                      <CardDescription>
                        Customer count over last 4 weeks
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[220px] min-h-[180px] w-full">
                        <Line
                          data={{
                            labels: customerGrowthData.map((d) => d.week),
                            datasets: [
                              {
                                label: "Customers",
                                data: customerGrowthData.map((d) => d.customers),
                                borderColor: resolvedColors.chart[0],
                                backgroundColor: resolvedColors.chart[0].startsWith("#") ? resolvedColors.chart[0] + "20" : resolvedColors.chart[0].replace(")", " / 0.12)"),
                                fill: true,
                                tension: 0.3,
                                pointBackgroundColor: resolvedColors.chart[0],
                                pointBorderColor: resolvedColors.background,
                                pointBorderWidth: 2,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { labels: { color: resolvedColors.mutedForeground } },
                              tooltip: {
                                backgroundColor: resolvedColors.card,
                                borderColor: resolvedColors.border,
                                borderWidth: 1,
                                cornerRadius: 8,
                                padding: 12,
                              },
                            },
                            scales: {
                              x: { ticks: { color: resolvedColors.mutedForeground }, grid: { color: resolvedColors.muted.startsWith("#") ? resolvedColors.muted + "80" : resolvedColors.muted.replace(")", " / 0.5)") } },
                              y: { ticks: { color: resolvedColors.mutedForeground }, grid: { color: resolvedColors.muted.startsWith("#") ? resolvedColors.muted + "80" : resolvedColors.muted.replace(")", " / 0.5)") } },
                            },
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent
                value="customers"
                className="mt-6 space-y-6 focus-visible:outline-none"
              >
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Customer insights</h2>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Customer growth</CardTitle>
                        <CardDescription>Last 4 weeks</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[240px] min-h-[180px] w-full">
                          <Bar
                            data={{
                              labels: customerGrowthData.map((d) => d.week),
                              datasets: [
                                {
                                  label: "Customers",
                                  data: customerGrowthData.map((d) => d.customers),
                                  backgroundColor: resolvedColors.chart[2],
                                  borderColor: resolvedColors.chart[3],
                                  borderWidth: 1,
                                  borderRadius: 4,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false, labels: { color: resolvedColors.mutedForeground } },
                                tooltip: {
                                  backgroundColor: resolvedColors.card,
                                  borderColor: resolvedColors.border,
                                  borderWidth: 1,
                                  cornerRadius: 8,
                                  padding: 12,
                                },
                              },
                              scales: {
                                x: { ticks: { color: resolvedColors.mutedForeground }, grid: { color: resolvedColors.muted.startsWith("#") ? resolvedColors.muted + "80" : resolvedColors.muted.replace(")", " / 0.5)") } },
                                y: { ticks: { color: resolvedColors.mutedForeground }, grid: { color: resolvedColors.muted.startsWith("#") ? resolvedColors.muted + "80" : resolvedColors.muted.replace(")", " / 0.5)") } },
                              },
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Top customers by spend</CardTitle>
                        <CardDescription>Monthly spend (RM)</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Customer</TableHead>
                              <TableHead>Plan</TableHead>
                              <TableHead className="text-right">
                                Monthly spend
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {topCustomers.map((c, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium">
                                  {c.name}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{c.plan}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {c.monthlySpend}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <StatCard
                      title="Total customers"
                      value={d?.customer_insights?.total_customers ?? 0}
                      subtitle="With subscriptions"
                      icon={Users}
                    />
                    <StatCard
                      title="New (7 days)"
                      value={d?.customer_insights?.new_customers_7d ?? 0}
                      subtitle="Last week"
                      icon={UserPlus}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="billing"
                className="mt-6 space-y-6 focus-visible:outline-none"
              >
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">
                    Payment & billing status
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      title="Successful payments"
                      value={paymentMetrics.successfulPayments}
                      subtitle="This month"
                      icon={CreditCard}
                    />
                    <StatCard
                      title="Failed payments"
                      value={paymentMetrics.failedPayments}
                      subtitle="Requires action"
                      icon={AlertCircle}
                      trend="down"
                    />
                    <StatCard
                      title="Outstanding invoices"
                      value={paymentMetrics.outstandingInvoices}
                      subtitle="Unpaid"
                      icon={AlertCircle}
                    />
                    <StatCard
                      title="Refunds issued"
                      value={paymentMetrics.refundsIssued}
                      subtitle="This month"
                      icon={DollarSign}
                    />
                  </div>
                  {paymentMetrics.failedPayments > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Failed payment alert</AlertTitle>
                      <AlertDescription>
                        {paymentMetrics.failedPayments} payment(s) failed in the
                        last 24 hours. Review and retry or contact customers.
                      </AlertDescription>
                    </Alert>
                  )}
                  <Card>
                    <CardHeader>
                      <CardTitle>Outstanding invoices</CardTitle>
                      <CardDescription>Unpaid invoices</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Due date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {outstandingInvoices.map((inv) => (
                            <TableRow key={inv.id}>
                              <TableCell className="font-mono text-sm">
                                {inv.id}
                              </TableCell>
                              <TableCell>{inv.customer}</TableCell>
                              <TableCell>{inv.amount}</TableCell>
                              <TableCell>{inv.due}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent
                value="plans"
                className="mt-6 space-y-6 focus-visible:outline-none"
              >
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Plan performance</h2>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Subscribers by plan</CardTitle>
                        <CardDescription>Distribution</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[260px] min-h-[200px] w-full">
                          <Pie
                            data={{
                              labels: planPieData.map((d) => d.name),
                              datasets: [
                                {
                                  data: planPieData.map((d) => d.value),
                                  backgroundColor: planPieData.map((d) => d.color),
                                  borderColor: resolvedColors.card,
                                  borderWidth: 2,
                                  hoverOffset: 4,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { position: "bottom", labels: { color: resolvedColors.mutedForeground, padding: 16 } },
                                tooltip: {
                                  backgroundColor: resolvedColors.card,
                                  borderColor: resolvedColors.border,
                                  borderWidth: 1,
                                  cornerRadius: 8,
                                  padding: 12,
                                  callbacks: {
                                    label: (ctx) => {
                                      const total = (ctx.dataset?.data as number[]).reduce((a, b) => a + b, 0);
                                      const pct = total ? ((Number(ctx.parsed) / total) * 100).toFixed(1) : "0";
                                      return ` ${ctx.label}: ${ctx.parsed} subscriber(s) (${pct}%)`;
                                    },
                                  },
                                },
                              },
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Revenue by plan</CardTitle>
                        <CardDescription>This month (RM)</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Plan</TableHead>
                              <TableHead className="text-right">
                                Subscribers
                              </TableHead>
                              <TableHead className="text-right">
                                Revenue
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {planPerformance.map((row) => (
                              <TableRow key={row.plan}>
                                <TableCell className="font-medium">
                                  {row.plan}
                                </TableCell>
                                <TableCell className="text-right">
                                  {row.subscribers}
                                </TableCell>
                                <TableCell className="text-right">
                                  RM{row.revenue.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Churn analysis</h2>
                  <Card>
                    <CardHeader>
                      <CardTitle>Churn & retention trend</CardTitle>
                      <CardDescription>
                        Monthly churn rate (%) and retention (%)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[280px] min-h-[200px] w-full">
                        <Line
                          data={{
                            labels: churnTrendData.map((d) => d.month),
                            datasets: [
                              {
                                label: "Churn rate",
                                data: churnTrendData.map((d) => d.churnRate),
                                borderColor: resolvedColors.destructive,
                                backgroundColor: resolvedColors.destructive.startsWith("#") ? resolvedColors.destructive + "20" : resolvedColors.destructive.replace(")", " / 0.12)"),
                                fill: true,
                                tension: 0.3,
                                pointBackgroundColor: resolvedColors.destructive,
                                pointBorderColor: resolvedColors.background,
                                pointBorderWidth: 2,
                              },
                              {
                                label: "Retention rate",
                                data: churnTrendData.map((d) => d.retention),
                                borderColor: resolvedColors.chart[1],
                                backgroundColor: resolvedColors.chart[1].startsWith("#") ? resolvedColors.chart[1] + "20" : resolvedColors.chart[1].replace(")", " / 0.12)"),
                                fill: true,
                                tension: 0.3,
                                pointBackgroundColor: resolvedColors.chart[1],
                                pointBorderColor: resolvedColors.background,
                                pointBorderWidth: 2,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { labels: { color: resolvedColors.mutedForeground } },
                              tooltip: {
                                backgroundColor: resolvedColors.card,
                                borderColor: resolvedColors.border,
                                borderWidth: 1,
                                cornerRadius: 8,
                                padding: 12,
                                callbacks: {
                                  label: (ctx) => ` ${ctx.dataset.label}: ${Number(ctx.parsed.y)}%`,
                                },
                              },
                            },
                            scales: {
                              x: { ticks: { color: resolvedColors.mutedForeground }, grid: { color: resolvedColors.muted.startsWith("#") ? resolvedColors.muted + "80" : resolvedColors.muted.replace(")", " / 0.5)") } },
                              y: {
                                min: 0,
                                max: 100,
                                ticks: {
                                  color: resolvedColors.mutedForeground,
                                  callback: (v) => `${v}%`,
                                },
                                grid: { color: resolvedColors.muted.startsWith("#") ? resolvedColors.muted + "80" : resolvedColors.muted.replace(")", " / 0.5)") },
                              },
                            },
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent
                value="system"
                className="mt-6 space-y-6 focus-visible:outline-none"
              >
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">System usage</h2>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Active users today
                        </CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {systemUsage.activeUsersToday}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Unique sessions
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          API calls
                        </CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {systemUsage.apiCalls.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          This month
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Storage usage
                        </CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {systemUsage.storageUsage}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Data stored
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
