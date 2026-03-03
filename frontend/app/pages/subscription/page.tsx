"use client";

import { useState, useEffect, Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  User,
  Building2,
  Crown,
  Briefcase,
  Landmark,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  CreditCard,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Trash2,
  Pencil,
  Download,
  HelpCircle,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getSubscriptionPageData,
  flattenSubscriptionsByOrganizations,
  createSubscription,
  updateSubscriptionStatus,
  deleteSubscription,
  getBillingHistory,
  type SubscriptionPlan,
  type Subscription,
  type BillingHistoryItem,
} from "@/lib/api/subscription/subscription";
import { InvoicePrintView } from "./InvoicePrintView";
import {
  getPaymentRequestStatus,
  createPaymentIntentForPlan,
  getPaymentStatus,
} from "@/lib/api/payment/payment";
import { getERPNextToken } from "@/lib/api/utils/token";
import { useRouter, useSearchParams } from "next/navigation";

type OrganizationType = "Customer" | "Government" | "System Owner Company";

interface PlanDisplay {
  id: string;
  name: string;
  description: string;
  price: string;
  priceNote?: string;
  icon: typeof User;
  badge?: string;
  features: {
    devices: string;
    messages: string;
    data: string;
    payment: string;
    trial?: string;
    billing?: string;
    special?: string;
  };
  popular?: boolean;
  color: string;
  allowedOrgTypes: OrganizationType[];
  requiresApproval?: boolean;
  planId?: string; // Maps to API plan name
}

const organizationTypes = [
  {
    value: "Customer",
    label: "Customer",
    description: "Normal company or individual",
    icon: Building2,
  },
  {
    value: "Government",
    label: "Government",
    description: "Government agency or project",
    icon: Landmark,
  },
  {
    value: "System Owner Company",
    label: "System Owner / Internal",
    description: "Internal use or system owner",
    icon: Shield,
  },
];

const SubscriptionPageInner = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [selectedBillingInterval, setSelectedBillingInterval] = useState<
    "Month" | "Year" | ""
  >("");
  const [showOrgDialog, setShowOrgDialog] = useState(false);
  const [selectedOrgType, setSelectedOrgType] = useState<OrganizationType | "">(
    "",
  );
  const [orgTypeError, setOrgTypeError] = useState("");

  // Organization creation form
  const [orgName, setOrgName] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [creatingSubscription, setCreatingSubscription] = useState(false);

  // All user subscriptions (Active, Suspended, Cancelled) across orgs
  const [mySubscriptions, setMySubscriptions] = useState<Subscription[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [loadingMySubscription, setLoadingMySubscription] = useState(true);
  const [isEnterpriseOpen, setIsEnterpriseOpen] = useState(false);
  const [showPlansAnyway, setShowPlansAnyway] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [subscriptionToCancel, setSubscriptionToCancel] =
    useState<Subscription | null>(null);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] =
    useState<Subscription | null>(null);
  const [deletingSubscription, setDeletingSubscription] = useState(false);
  const [payRedirecting, setPayRedirecting] = useState(false);
  const [payAgainLoading, setPayAgainLoading] = useState<string | null>(null);
  const [returnPaymentStatus, setReturnPaymentStatus] = useState<
    "idle" | "polling" | "paid" | "unpaid" | "failed" | "error"
  >("idle");
  const [returnPaymentRequest, setReturnPaymentRequest] = useState<
    string | null
  >(null);
  const [returnPaymentStatusData, setReturnPaymentStatusData] = useState<{
    can_pay_again: boolean;
    can_cancel: boolean;
    subscription_name?: string | null;
  } | null>(null);
  const [refreshSubscriptionsTrigger, setRefreshSubscriptionsTrigger] =
    useState(0);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>(
    [],
  );
  const [loadingBillingHistory, setLoadingBillingHistory] = useState(false);
  const [invoiceForPrint, setInvoiceForPrint] =
    useState<BillingHistoryItem | null>(null);
  const [canSubscribe, setCanSubscribe] = useState(false);
  const [organizationsForSubscribe, setOrganizationsForSubscribe] = useState<
    { name: string; organization_name: string }[]
  >([]);
  // Single gate: minimum time so we never flash "Subscription Plans" before "My Subscription"
  const [loaderMinTimeElapsed, setLoaderMinTimeElapsed] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const t = setTimeout(() => setLoaderMinTimeElapsed(true), 400);
    return () => clearTimeout(t);
  }, []);

  // Single loading flag: gate both "All Plans" and "My Subscription" until user + subscription data are loaded
  const pageDataReady = !loadingMySubscription && loaderMinTimeElapsed;

  const hasSubscription = mySubscriptions.length > 0;
  const hasActiveSubscription = mySubscriptions.some((s) => {
    const st = (s.status || "").toString();
    return st === "Active" || st === "Trialling";
  });
  const showPlanCards =
    (!hasSubscription && canSubscribe) ||
    showPlansAnyway ||
    (hasSubscription && !hasActiveSubscription && canSubscribe);

  function canCancelSub(sub: Subscription) {
    const status = (sub.status || "").toString();
    return (
      status === "Active" || status === "Trialling" || status === "Suspended"
    );
  }

  function handlePrintInvoice(row: BillingHistoryItem) {
    setInvoiceForPrint(row);
    setTimeout(() => {
      window.print();
    }, 0);
  }

  // Poll payment status when returning from Stripe (?payment_request=XXX) — uses getPaymentStatus for can_pay_again/can_cancel
  useEffect(() => {
    const pr = searchParams.get("payment_request");
    if (!pr) {
      setReturnPaymentStatus("idle");
      setReturnPaymentRequest(null);
      setReturnPaymentStatusData(null);
      return;
    }
    setReturnPaymentRequest(pr);
    let cancelled = false;
    const maxAttempts = 20;
    const intervalMs = 2000;
    (async () => {
      setReturnPaymentStatus("polling");
      for (let attempt = 0; attempt < maxAttempts && !cancelled; attempt++) {
        try {
          const res = await getPaymentStatus(pr);
          if (cancelled) return;
          setReturnPaymentStatusData({
            can_pay_again: res.can_pay_again,
            can_cancel: res.can_cancel,
            subscription_name: res.subscription_name,
          });
          if (res.status === "Paid") {
            setReturnPaymentStatus("paid");
            setSuccess("Payment recorded. Your subscription is active.");
            setRefreshSubscriptionsTrigger((t) => t + 1);
            return;
          }
          if (res.status === "Cancelled") {
            setReturnPaymentStatus("failed");
            return;
          }
        } catch {
          if (cancelled) return;
        }
        await new Promise((r) => setTimeout(r, intervalMs));
      }
      if (!cancelled) {
        setReturnPaymentStatus("unpaid");
        try {
          const res = await getPaymentStatus(pr);
          if (!cancelled)
            setReturnPaymentStatusData({
              can_pay_again: res.can_pay_again,
              can_cancel: res.can_cancel,
              subscription_name: res.subscription_name,
            });
        } catch {
          setReturnPaymentStatusData({
            can_pay_again: true,
            can_cancel: false,
            subscription_name: null,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  // Single API call: subscription page data (has_subscription, active status, can_subscribe, organizations, plans) — no flash
  useEffect(() => {
    let cancelled = false;
    async function loadPageData() {
      try {
        const token = await getERPNextToken();
        if (!token) {
          if (!cancelled) {
            setMySubscriptions([]);
            setPlans([]);
            setCanSubscribe(false);
            setOrganizationsForSubscribe([]);
          }
          setLoadingMySubscription(false);
          setLoading(false);
          return;
        }
        const data = await getSubscriptionPageData();
        if (cancelled) {
          setLoadingMySubscription(false);
          setLoading(false);
          return;
        }
        const all = flattenSubscriptionsByOrganizations(
          data.organizations || [],
        );
        const statusOrder = (s: Subscription) => {
          const st = (s.status || "").toString().toLowerCase();
          if (st === "active" || st === "trialling") return 0;
          if (st === "suspended" || st === "past due date" || st === "unpaid")
            return 1;
          return 2;
        };
        all.sort((a, b) => statusOrder(a) - statusOrder(b));
        if (!cancelled) {
          setMySubscriptions(all);
          setPlans(data.plans || []);
          setCanSubscribe(data.can_subscribe);
          setOrganizationsForSubscribe(data.organizations_for_subscribe || []);
        }
      } catch {
        if (!cancelled) {
          setMySubscriptions([]);
          setPlans([]);
          setCanSubscribe(false);
          setOrganizationsForSubscribe([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingMySubscription(false);
          setLoading(false);
        }
      }
    }
    loadPageData();
    return () => {
      cancelled = true;
    };
  }, [refreshSubscriptionsTrigger]);

  // Load billing history when user has subscriptions (by organization so we get all related payment requests)
  useEffect(() => {
    if (mySubscriptions.length === 0) {
      setBillingHistory([]);
      return;
    }
    const org = mySubscriptions[0].organization;
    if (!org) return;
    let cancelled = false;
    setLoadingBillingHistory(true);
    getBillingHistory({ organization: org })
      .then((res) => {
        if (!cancelled) setBillingHistory(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setBillingHistory([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingBillingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mySubscriptions.length, mySubscriptions[0]?.organization]);

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setSelectedBillingInterval(
      plan.billing_interval === "Month" || plan.billing_interval === "Year"
        ? plan.billing_interval
        : "",
    );
    setSelectedOrgType("");
    setOrgTypeError("");
    setOrgName("");
    setOrgEmail("");
    setOrgPhone("");
    setOrgAddress("");

    // Auto-select organization type based on plan name
    if (plan.plan_name.toLowerCase().includes("government")) {
      setSelectedOrgType("Government");
    } else if (plan.plan_name.toLowerCase().includes("personal")) {
      setSelectedOrgType("Customer");
    }

    setShowOrgDialog(true);
  };

  const handleOrgTypeChange = (value: OrganizationType) => {
    setSelectedOrgType(value);
    setOrgTypeError("");
  };

  const PLAN_PAYMENT_STORAGE_KEY = "plan_payment";
  const CHECKOUT_CONTEXT_KEY = "checkout_context";

  /** Save plan + org details and go to Checkout page; payment happens there. */
  const handleProceedToCheckout = () => {
    if (!selectedOrgType) {
      setOrgTypeError("Please select an organization type");
      return;
    }
    if (!orgName.trim()) {
      setOrgTypeError("Organization name is required");
      return;
    }
    if (!selectedBillingInterval) {
      setOrgTypeError("Please select a billing interval");
      return;
    }

    let planToUse = selectedPlan;
    if (
      selectedPlan &&
      selectedPlan.billing_interval !== selectedBillingInterval
    ) {
      const matchingPlan = plans.find(
        (p) =>
          p.plan_name === selectedPlan.plan_name &&
          p.billing_interval === selectedBillingInterval,
      );
      if (matchingPlan) {
        planToUse = matchingPlan;
      } else {
        setOrgTypeError(
          `Plan "${selectedPlan.plan_name}" with ${selectedBillingInterval === "Month" ? "Month" : "Year"} billing is not available.`,
        );
        return;
      }
    }

    if (!planToUse) {
      setOrgTypeError("Please select a plan");
      return;
    }

    const checkoutContext = {
      plan: planToUse,
      orgName: orgName.trim(),
      orgEmail: orgEmail.trim() || undefined,
      orgPhone: orgPhone.trim() || undefined,
      orgAddress: orgAddress.trim() || undefined,
      selectedOrgType,
    };
    try {
      sessionStorage.setItem(
        CHECKOUT_CONTEXT_KEY,
        JSON.stringify(checkoutContext),
      );
    } catch {
      setOrgTypeError("Failed to save checkout data");
      return;
    }

    setShowOrgDialog(false);
    setSelectedPlan(null);
    setSelectedBillingInterval("");
    setSelectedOrgType("");
    setOrgName("");
    setOrgEmail("");
    setOrgPhone("");
    setOrgAddress("");
    setOrgTypeError("");
    router.push("/pages/checkout");
  };

  /** Pay again for pay-first flow (use org + plan from sessionStorage). */
  const handlePayAgainPlan = async () => {
    if (typeof window === "undefined" || !returnPaymentRequest) return;
    try {
      let planPayment: {
        organization?: string;
        plan?: string;
        amount?: number;
      } | null = null;
      try {
        const raw = sessionStorage.getItem(PLAN_PAYMENT_STORAGE_KEY);
        if (raw) planPayment = JSON.parse(raw);
      } catch {
        // ignore
      }
      if (!planPayment?.organization || !planPayment?.plan) {
        setError(
          "Payment session expired. Please select a plan and pay again from the start.",
        );
        return;
      }
      setPayAgainLoading(returnPaymentRequest);
      const result = await createPaymentIntentForPlan(
        planPayment.organization,
        planPayment.plan,
        typeof planPayment.amount === "number" && planPayment.amount > 0
          ? planPayment.amount
          : undefined,
      );
      const returnTo = "/pages/subscription";
      const nextPlanPayment = {
        ...planPayment,
        payment_request: result.payment_request,
        client_secret: result.client_secret,
        publishable_key: result.publishable_key,
        amount: result.amount,
        currency: result.currency,
        return_to: returnTo,
      };
      sessionStorage.setItem(
        PLAN_PAYMENT_STORAGE_KEY,
        JSON.stringify(nextPlanPayment),
      );
      router.push(
        `/pages/pay/${encodeURIComponent(result.payment_request)}?return_to=${encodeURIComponent(returnTo)}`,
      );
    } catch (err: any) {
      console.error("Failed to start payment:", err);
      setError(err?.message || "Failed to start payment");
    } finally {
      setPayAgainLoading(null);
    }
  };

  /** Pay again for existing Unpaid subscription (subscription-already-created flow). */
  const handlePayAgain = async (sub: Subscription) => {
    const amount =
      sub.plan_details?.cost ?? sub.plan_details?.plan_price ?? sub.plan_price;
    try {
      setPayAgainLoading(sub.name);
      const { getPaymentRequestForSubscription } =
        await import("@/lib/api/subscription/subscription");
      const { payment_request } = await getPaymentRequestForSubscription(
        sub.name,
        typeof amount === "number" && amount > 0 ? amount : undefined,
      );
      router.push(
        `/pages/pay/${encodeURIComponent(payment_request)}?return_to=${encodeURIComponent("/pages/subscription")}`,
      );
    } catch (err: any) {
      console.error("Failed to get payment link:", err);
      setError(err?.message || "Failed to start payment");
    } finally {
      setPayAgainLoading(null);
    }
  };

  const formatPlanFeatures = (plan: SubscriptionPlan) => {
    const isPersonalBasic =
      plan.plan_name.toLowerCase().includes("personal basic") ||
      (plan.plan_name.toLowerCase().includes("personal") &&
        plan.plan_name.toLowerCase().includes("basic"));

    return {
      devices: `${plan.max_devices} device${plan.max_devices !== 1 ? "s" : ""}`,
      messages: `${plan.included_messages.toLocaleString()} messages/${plan.billing_interval.toLowerCase()}`,
      data: `${plan.included_data_mb} MB`,
      payment:
        plan.billing_interval === "Month"
          ? "Monthly billing"
          : "Yearly billing",
      trial:
        isPersonalBasic && plan.billing_interval === "Month"
          ? "7 days free trial"
          : undefined,
    };
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes("personal") || name.includes("basic")) return User;
    if (name.includes("starter") || name.includes("sme")) return Briefcase;
    if (name.includes("business")) return Crown;
    if (name.includes("enterprise")) return Building2;
    if (name.includes("government")) return Landmark;
    return User;
  };

  const getPlanColor = (index: number) => {
    const colors = [
      "border-blue-200 dark:border-blue-800",
      "border-primary",
      "border-purple-200 dark:border-purple-800",
      "border-orange-200 dark:border-orange-800",
      "border-green-200 dark:border-green-800",
    ];
    return colors[index % colors.length];
  };

  // Get plan price: use cost (built-in) or plan_price from API when set, else fallback to defaults
  const getPlanPrice = (
    planName: string,
    billingInterval: string,
    planPrice?: number,
  ): string => {
    if (planPrice != null && planPrice > 0) {
      return `RM ${Number(planPrice).toFixed(2)}`;
    }
    const name = planName.toLowerCase();
    if (name.includes("enterprise")) {
      return "Cost Negotiated";
    }
    if (
      name.includes("personal basic") ||
      (name.includes("personal") && name.includes("basic"))
    ) {
      return "RM 5.00";
    }
    if (
      name.includes("starter") ||
      name.includes("sme") ||
      name.includes("pilot")
    ) {
      return "RM 40.00";
    }
    if (name.includes("business")) {
      return "RM 300.00";
    }
    return "Contact Us";
  };

  // Filter and sort plans
  const filterAndSortPlans = (plans: SubscriptionPlan[]) => {
    // Filter out Government plans
    const filtered = plans.filter(
      (plan) => !plan.plan_name.toLowerCase().includes("government"),
    );

    // Separate Enterprise plans
    const enterprisePlans = filtered.filter((plan) =>
      plan.plan_name.toLowerCase().includes("enterprise"),
    );
    const otherPlans = filtered.filter(
      (plan) => !plan.plan_name.toLowerCase().includes("enterprise"),
    );

    // Sort other plans: Personal Basic, Starter SME/Pilot, Business
    const sorted = otherPlans.sort((a, b) => {
      const aName = a.plan_name.toLowerCase();
      const bName = b.plan_name.toLowerCase();

      // Personal Basic first
      if (
        aName.includes("personal basic") ||
        (aName.includes("personal") && aName.includes("basic"))
      ) {
        if (
          !bName.includes("personal basic") &&
          !(bName.includes("personal") && bName.includes("basic"))
        ) {
          return -1;
        }
      }
      if (
        bName.includes("personal basic") ||
        (bName.includes("personal") && bName.includes("basic"))
      ) {
        if (
          !aName.includes("personal basic") &&
          !(aName.includes("personal") && aName.includes("basic"))
        ) {
          return 1;
        }
      }

      // Starter SME/Pilot second
      if (
        aName.includes("starter") ||
        aName.includes("sme") ||
        aName.includes("pilot")
      ) {
        if (
          !bName.includes("starter") &&
          !bName.includes("sme") &&
          !bName.includes("pilot")
        ) {
          if (
            !aName.includes("personal basic") &&
            !(aName.includes("personal") && aName.includes("basic"))
          ) {
            return -1;
          }
        }
      }
      if (
        bName.includes("starter") ||
        bName.includes("sme") ||
        bName.includes("pilot")
      ) {
        if (
          !aName.includes("starter") &&
          !aName.includes("sme") &&
          !aName.includes("pilot")
        ) {
          if (
            !bName.includes("personal basic") &&
            !(bName.includes("personal") && bName.includes("basic"))
          ) {
            return 1;
          }
        }
      }

      // Business third
      if (aName.includes("business") && !bName.includes("business")) {
        if (
          !aName.includes("personal") &&
          !aName.includes("starter") &&
          !aName.includes("sme") &&
          !aName.includes("pilot")
        ) {
          return -1;
        }
      }
      if (bName.includes("business") && !aName.includes("business")) {
        if (
          !bName.includes("personal") &&
          !bName.includes("starter") &&
          !bName.includes("sme") &&
          !bName.includes("pilot")
        ) {
          return 1;
        }
      }

      return 0;
    });

    return { sorted, enterprisePlans };
  };

  // Single gate: do not render "All Subscription Plans" or "My Subscription" until user + subscription data are loaded
  if (!pageDataReady) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <div className="flex flex-1 flex-col gap-4 p-6 animate-in fade-in-0 duration-200">
            <div className="mx-auto w-full max-w-7xl space-y-12">
              {/* Skeleton: no "Subscription Plans" or "My Subscription" text until data is ready */}
              <div className="space-y-4">
                <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
                <Skeleton className="h-5 w-full max-w-2xl mx-auto md:mx-0" />
                <Skeleton className="h-5 w-full max-w-xl mx-auto md:mx-0" />
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[320px] rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="flex flex-1 flex-col gap-4 p-6 animate-in fade-in-0 duration-300">
          <div className="mx-auto w-full max-w-7xl space-y-12">
            {/* Header - show My Subscription title when user has subscription, otherwise Subscription Plans */}
            <div
              className={
                hasSubscription ? "text-left" : "text-center space-y-4"
              }
            >
              {hasSubscription ? (
                <div className="mb-8">
                  <h1 className="text-3xl font-bold tracking-tight">
                    My Subscriptions
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Manage your plan, billing information and view history.
                  </p>
                  {!hasActiveSubscription && (
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Your subscription has been cancelled. Choose a plan
                        below to Subscribe to a new plan.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <Sparkles className="h-4 w-4" />
                    Choose Your Plan
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Subscription Plans
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Select the perfect plan for your LoRaWAN network needs. All
                    plans include usage limits that are enforced by the system.
                  </p>
                </>
              )}
            </div>

            {/* Error/Success Messages */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Payment return status block intentionally hidden per requirements */}

            {/* My Subscription Dashboard (when user has active subscription and not showing plan cards) - smooth appear so user never sees plans first */}
            {hasSubscription &&
              hasActiveSubscription &&
              !showPlanCards &&
              (() => {
                const activeSub =
                  mySubscriptions.find(
                    (s) =>
                      (s.status || "").toString() === "Active" ||
                      (s.status || "").toString() === "Trialling",
                  ) || mySubscriptions[0];
                const planName =
                  activeSub?.plan_details?.plan_name || activeSub?.plan || "—";
                const price =
                  activeSub?.plan_price ??
                  activeSub?.plan_details?.cost ??
                  activeSub?.plan_details?.plan_price;
                const priceStr =
                  price != null && price > 0
                    ? `RM ${Number(price).toFixed(2)}`
                    : "—";
                const billingLabel = (
                  activeSub?.plan_details?.billing_interval || ""
                )
                  .toLowerCase()
                  .startsWith("year")
                  ? "year"
                  : "month";
                const endDate = activeSub?.end_date
                  ? new Date(activeSub.end_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—";
                const deviceCount = activeSub?.usage?.device_count ?? 0;
                const maxDevices = activeSub?.plan_details?.max_devices ?? 1;
                const messageCount = activeSub?.usage?.message_count ?? 0;
                const maxMessages =
                  activeSub?.plan_details?.included_messages ?? 1;
                const storagePct =
                  maxDevices > 0
                    ? Math.min(100, (deviceCount / maxDevices) * 100)
                    : 0;
                const messagesPct =
                  maxMessages > 0
                    ? Math.min(100, (messageCount / maxMessages) * 100)
                    : 0;
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in-0 duration-300">
                    {/* Left: Active Plan + Billing History */}
                    <div className="lg:col-span-2 space-y-8">
                      {/* Active Plan Hero Card */}
                      <Card className="relative overflow-hidden rounded-xl border-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-xl shadow-primary/20">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        <CardContent className="relative z-10 p-8">
                          <div className="flex justify-between items-start">
                            <div>
                              <Badge className="mb-2 bg-white/20 text-white border-0 uppercase tracking-wider text-xs">
                                Active Plan
                              </Badge>
                              <CardTitle className="text-4xl font-bold mt-2 text-primary-foreground">
                                {planName}
                              </CardTitle>
                              <p className="text-primary-foreground/80 mt-1">
                                Billed{" "}
                                {billingLabel === "year"
                                  ? "annually"
                                  : "monthly"}{" "}
                                • Next renewal {endDate}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-4xl font-bold text-primary-foreground">
                                {priceStr}
                              </span>
                              <span className="text-primary-foreground/70 block">
                                /{billingLabel}
                              </span>
                            </div>
                          </div>
                          {/* Usage bar */}
                          <div className="mt-10">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="font-medium">Usage</span>
                              <span className="font-medium text-primary-foreground/90">
                                {deviceCount} / {maxDevices} devices ·{" "}
                                {(messageCount || 0).toLocaleString()} /{" "}
                                {(maxMessages || 0).toLocaleString()} messages
                              </span>
                            </div>
                            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-white rounded-full transition-all"
                                style={{
                                  width: `${Math.max(storagePct, messagesPct)}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-primary-foreground/70 mt-3">
                              Your usage resets on the next billing cycle.
                            </p>
                          </div>
                          <div className="mt-8 flex flex-wrap gap-4">
                            <Button
                              variant="secondary"
                              className="bg-white text-primary hover:bg-white/90"
                              onClick={() => setShowPlansAnyway(true)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Change Plan
                            </Button>
                            {activeSub && canCancelSub(activeSub) && (
                              <Button
                                variant="outline"
                                className="bg-white/10 border-white/30 hover:bg-white/20 text-primary-foreground"
                                onClick={() => {
                                  setSubscriptionToCancel(activeSub);
                                  setShowCancelDialog(true);
                                }}
                              >
                                Cancel Subscription
                              </Button>
                            )}
                            {activeSub &&
                              ((activeSub.status || "").toString() ===
                                "Unpaid" ||
                                (activeSub.status || "").toString() ===
                                  "Past Due Date") && (
                                <Button
                                  onClick={() => handlePayAgain(activeSub)}
                                  disabled={payAgainLoading === activeSub.name}
                                  className="bg-white text-primary hover:bg-white/90"
                                >
                                  {payAgainLoading === activeSub.name ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <CreditCard className="mr-2 h-4 w-4" />
                                  )}
                                  Pay again
                                </Button>
                              )}
                          </div>
                        </CardContent>
                      </Card>
                      {/* Billing History */}
                      <Card className="rounded-xl">
                        <div className="px-6 py-5 border-b flex justify-between items-center">
                          <h3 className="font-bold text-lg">Billing History</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary font-semibold"
                          >
                            View All
                          </Button>
                        </div>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="uppercase text-muted-foreground font-semibold">
                                  Date
                                </TableHead>
                                <TableHead className="uppercase text-muted-foreground font-semibold">
                                  Description
                                </TableHead>
                                <TableHead className="uppercase text-muted-foreground font-semibold">
                                  Amount
                                </TableHead>
                                <TableHead className="uppercase text-muted-foreground font-semibold">
                                  Status
                                </TableHead>
                                <TableHead className="uppercase text-muted-foreground font-semibold text-right">
                                  Invoice
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y">
                              {loadingBillingHistory ? (
                                <TableRow>
                                  <TableCell
                                    colSpan={5}
                                    className="text-center py-8"
                                  >
                                    <div className="flex justify-center">
                                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : billingHistory.length === 0 ? (
                                <TableRow>
                                  <TableCell
                                    colSpan={5}
                                    className="text-center text-muted-foreground py-8"
                                  >
                                    No billing history yet.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                billingHistory.slice(0, 10).map((row) => (
                                  <TableRow key={row.name}>
                                    <TableCell className="font-medium">
                                      {row.creation
                                        ? new Date(
                                            row.creation,
                                          ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                          })
                                        : "—"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {row.subject ||
                                        row.reference_name ||
                                        `Payment Request ${row.name}`}
                                    </TableCell>
                                    <TableCell className="font-bold">
                                      {row.grand_total != null
                                        ? `${row.currency === "MYR" ? "RM" : row.currency || "RM"} ${Number(row.grand_total).toFixed(2)}`
                                        : "—"}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        className={
                                          row.status === "Paid"
                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                            : row.status === "Requested" ||
                                                row.status === "Draft"
                                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                              : "bg-muted text-muted-foreground"
                                        }
                                      >
                                        {row.status || "—"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-primary"
                                        title={`Print invoice ${row.name}`}
                                        onClick={() => handlePrintInvoice(row)}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </Card>
                    </div>
                    {/* Right: Payment Method, Support, Resource Limits */}
                    <div className="space-y-6">
                      <Card className="p-6 rounded-xl border-primary/10 bg-primary/5">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                          <HelpCircle className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          If you have questions about your billing or plan, our
                          support team is available 24/7.
                        </p>
                        <a
                          href="#"
                          className="text-primary font-semibold text-sm inline-flex items-center gap-1 group"
                        >
                          Contact Support
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                      </Card>
                      <Card className="p-6 rounded-xl">
                        <h3 className="font-bold text-sm uppercase text-muted-foreground tracking-wider mb-4">
                          Resource Limits
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">
                                Devices
                              </span>
                              <span className="font-semibold">
                                {deviceCount} / {maxDevices}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${storagePct}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">
                                Messages
                              </span>
                              <span className="font-semibold">
                                {(messageCount || 0).toLocaleString()} /{" "}
                                {(maxMessages || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${messagesPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full mt-6"
                          onClick={() => setShowPlansAnyway(true)}
                        >
                          Upgrade Limits
                        </Button>
                      </Card>
                    </div>
                  </div>
                );
              })()}

            {/* Pricing / Resubscribe Cards */}
            {showPlanCards &&
              (loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : plans.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No subscription plans available at the moment.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {hasSubscription && hasActiveSubscription && (
                    <div className="mb-6">
                      <Button
                        variant="outline"
                        onClick={() => setShowPlansAnyway(false)}
                      >
                        <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                        Back to My Subscriptions
                      </Button>
                    </div>
                  )}
                  {hasSubscription && !hasActiveSubscription && (
                    <div className="space-y-2 mt-4">
                      <h2 className="text-2xl font-bold tracking-tight">
                        Subscribe to a new plan
                      </h2>
                      <p className="text-muted-foreground max-w-2xl">
                        Your previous subscription has been cancelled. Select a
                        new plan below to restart your subscription.
                      </p>
                    </div>
                  )}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
                    {filterAndSortPlans(plans).sorted.map((plan, index) => {
                      const Icon = getPlanIcon(plan.plan_name);
                      const features = formatPlanFeatures(plan);
                      const planNameLower = plan.plan_name.toLowerCase();
                      const isPopular =
                        planNameLower.includes("starter") ||
                        planNameLower.includes("sme") ||
                        planNameLower.includes("pilot");
                      const price = getPlanPrice(
                        plan.plan_name,
                        plan.billing_interval,
                        plan.cost ?? plan.plan_price,
                      );

                      const isResubscribeMode =
                        hasSubscription &&
                        !hasActiveSubscription &&
                        canSubscribe;
                      return (
                        <Card
                          key={plan.name}
                          className={`relative flex flex-col transition-all hover:shadow-lg ${
                            isPopular
                              ? "border-2 shadow-md scale-105"
                              : getPlanColor(index)
                          }`}
                        >
                          {isPopular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <Badge className="bg-primary text-primary-foreground px-4 py-1">
                                Popular
                              </Badge>
                            </div>
                          )}
                          <CardHeader className="text-center pb-6">
                            <div
                              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
                                isPopular
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <Icon className="h-7 w-7" />
                            </div>
                            <CardTitle className="text-xl">
                              {plan.plan_name}
                            </CardTitle>
                            <div className="mt-4">
                              <div className="text-3xl font-bold text-primary">
                                {price}
                              </div>
                              <CardDescription className="mt-2 text-sm">
                                {plan.billing_interval === "Month"
                                  ? "per month"
                                  : plan.billing_interval === "Year"
                                    ? "per year"
                                    : plan.billing_interval === "Week"
                                      ? "per week"
                                      : "per day"}
                              </CardDescription>
                            </div>
                          </CardHeader>
                          <CardContent className="flex-1 space-y-3">
                            <div className="space-y-2.5">
                              <div className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                <span className="text-sm">
                                  {features.devices}
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                <span className="text-sm">
                                  {features.messages}
                                </span>
                              </div>
                              <div className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{features.data}</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                <span className="text-sm">
                                  {features.payment}
                                </span>
                              </div>
                              {features.trial && (
                                <div className="flex items-start gap-2">
                                  <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                  <span className="text-sm font-medium text-primary">
                                    {features.trial}
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button
                              className="w-full"
                              variant={isPopular ? "default" : "outline"}
                              size="lg"
                              onClick={() => handlePlanSelect(plan)}
                              disabled={false}
                            >
                              {isResubscribeMode
                                ? "Select Plan"
                                : "Select Plan"}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Enterprise Plans - Collapsible */}
                  {filterAndSortPlans(plans).enterprisePlans.length > 0 && (
                    <div className="mt-8">
                      <Collapsible
                        open={isEnterpriseOpen}
                        onOpenChange={setIsEnterpriseOpen}
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between"
                            size="lg"
                          >
                            <span className="flex items-center gap-2">
                              <Building2 className="h-5 w-5" />
                              Enterprise Plans
                            </span>
                            {isEnterpriseOpen ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
                            {filterAndSortPlans(plans).enterprisePlans.map(
                              (plan, index) => {
                                const Icon = getPlanIcon(plan.plan_name);
                                const features = formatPlanFeatures(plan);
                                const price = getPlanPrice(
                                  plan.plan_name,
                                  plan.billing_interval,
                                  plan.cost ?? plan.plan_price,
                                );

                                return (
                                  <Card
                                    key={plan.name}
                                    className={`relative flex flex-col transition-all hover:shadow-lg ${getPlanColor(
                                      index,
                                    )}`}
                                  >
                                    <CardHeader className="text-center pb-6">
                                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                        <Icon className="h-7 w-7" />
                                      </div>
                                      <CardTitle className="text-xl">
                                        {plan.plan_name}
                                      </CardTitle>
                                      <div className="mt-4">
                                        <div className="text-3xl font-bold text-primary">
                                          {price}
                                        </div>
                                        <CardDescription className="mt-2 text-sm">
                                          {plan.plan_name
                                            .toLowerCase()
                                            .includes("custom")
                                            ? "Monthly/Yearly"
                                            : plan.billing_interval === "Month"
                                              ? "per month"
                                              : "per year"}
                                        </CardDescription>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-3">
                                      <div className="space-y-2.5">
                                        <div className="flex items-start gap-2">
                                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                          <span className="text-sm">
                                            {features.devices}
                                          </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                          <span className="text-sm">
                                            {features.messages}
                                          </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                          <span className="text-sm">
                                            {features.data}
                                          </span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                          <span className="text-sm">
                                            {features.payment}
                                          </span>
                                        </div>
                                      </div>
                                    </CardContent>
                                    <CardFooter>
                                      <Button
                                        className="w-full"
                                        variant="outline"
                                        size="lg"
                                        onClick={() => handlePlanSelect(plan)}
                                        disabled={false}
                                      >
                                        Select Plan
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                      </Button>
                                    </CardFooter>
                                  </Card>
                                );
                              },
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}
                </>
              ))}

            {/* Info Section - hide when showing "My Subscription" hero */}
            {showPlanCards && (
              <Card className="bg-muted/50 border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    How It Works
                  </CardTitle>
                  <CardDescription>
                    Understanding subscription plans and limits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment Terms
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Plans support monthly or yearly billing based on your
                        selection.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        System Enforcement
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        All limits (devices, messages, data) are automatically
                        enforced by the system. Exceeding limits will block or
                        warn.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Trial Period
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Personal Basic Monthly plan includes a 7-day free trial.
                        After trial ends, payment is required to continue.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Cancel subscription confirmation */}
        <AlertDialog
          open={showCancelDialog}
          onOpenChange={(open) => {
            setShowCancelDialog(open);
            if (!open) setSubscriptionToCancel(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this subscription? You will no
                longer have access to the plan benefits. You can subscribe to a
                new plan below.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancellingSubscription}>
                Keep subscription
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={cancellingSubscription || !subscriptionToCancel?.name}
                onClick={async (e) => {
                  e.preventDefault();
                  if (!subscriptionToCancel?.name) return;
                  setCancellingSubscription(true);
                  setError(null);
                  try {
                    const result = await updateSubscriptionStatus(
                      subscriptionToCancel.name,
                      "Cancelled",
                    );
                    const updated = result.data || {
                      ...subscriptionToCancel,
                      status: "Cancelled" as const,
                    };
                    setMySubscriptions((prev) =>
                      prev.map((s) =>
                        s.name === subscriptionToCancel.name ? updated : s,
                      ),
                    );
                    setSuccess(
                      "Subscription cancelled. You can choose a new plan below.",
                    );
                    setShowCancelDialog(false);
                    setSubscriptionToCancel(null);
                    setShowPlansAnyway(true);
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Failed to cancel subscription",
                    );
                  } finally {
                    setCancellingSubscription(false);
                  }
                }}
              >
                {cancellingSubscription ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Cancel subscription
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete (cancelled) subscription confirmation */}
        <AlertDialog
          open={showDeleteDialog}
          onOpenChange={(open) => {
            setShowDeleteDialog(open);
            if (!open) setSubscriptionToDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete subscription?</AlertDialogTitle>
              <AlertDialogDescription>
                This cancelled subscription will be permanently removed. This
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingSubscription}>
                Keep
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deletingSubscription || !subscriptionToDelete?.name}
                onClick={async (e) => {
                  e.preventDefault();
                  if (!subscriptionToDelete?.name) return;
                  setDeletingSubscription(true);
                  setError(null);
                  try {
                    await deleteSubscription(subscriptionToDelete.name);
                    setMySubscriptions((prev) =>
                      prev.filter((s) => s.name !== subscriptionToDelete.name),
                    );
                    setSuccess("Subscription deleted.");
                    setShowDeleteDialog(false);
                    setSubscriptionToDelete(null);
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Failed to delete subscription",
                    );
                  } finally {
                    setDeletingSubscription(false);
                  }
                }}
              >
                {deletingSubscription ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Organization Creation Dialog */}
        <Dialog open={showOrgDialog} onOpenChange={setShowOrgDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Organization & Subscription</DialogTitle>
              <DialogDescription>
                Create a new organization and subscribe to the selected plan.
                {selectedPlan &&
                  (selectedPlan.plan_name
                    .toLowerCase()
                    .includes("personal basic") ||
                    (selectedPlan.plan_name
                      .toLowerCase()
                      .includes("personal") &&
                      selectedPlan.plan_name
                        .toLowerCase()
                        .includes("basic"))) &&
                  selectedBillingInterval === "Month" && (
                    <span className="text-primary font-medium block mt-2">
                      Personal Basic Monthly plan includes a 7-day free trial.
                    </span>
                  )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="billing-interval">Billing Interval *</Label>
                <Select
                  value={selectedBillingInterval}
                  onValueChange={(value) =>
                    setSelectedBillingInterval(value as "Month" | "Year")
                  }
                >
                  <SelectTrigger id="billing-interval" className="w-full">
                    <SelectValue placeholder="Select billing interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Month">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Month</div>
                          {selectedPlan &&
                            (selectedPlan.plan_name
                              .toLowerCase()
                              .includes("personal basic") ||
                              (selectedPlan.plan_name
                                .toLowerCase()
                                .includes("personal") &&
                                selectedPlan.plan_name
                                  .toLowerCase()
                                  .includes("basic"))) && (
                              <div className="text-xs text-primary font-medium">
                                Includes 7-day free trial
                              </div>
                            )}
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="Year">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Year</div>
                          <div className="text-xs text-muted-foreground">
                            Annual billing, better value
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-type">Organization Type *</Label>
                <Select
                  value={selectedOrgType}
                  onValueChange={(value) =>
                    handleOrgTypeChange(value as OrganizationType)
                  }
                >
                  <SelectTrigger id="org-type" className="w-full">
                    <SelectValue placeholder="Select organization type" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizationTypes.map((org) => {
                      const OrgIcon = org.icon;
                      return (
                        <SelectItem key={org.value} value={org.value}>
                          <div className="flex items-center gap-2">
                            <OrgIcon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{org.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {org.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {orgTypeError && (
                  <p className="text-sm text-destructive">{orgTypeError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name *</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Enter organization name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-email">Contact Email</Label>
                <Input
                  id="org-email"
                  type="email"
                  value={orgEmail}
                  onChange={(e) => setOrgEmail(e.target.value)}
                  placeholder="contact@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-phone">Contact Phone</Label>
                <Input
                  id="org-phone"
                  value={orgPhone}
                  onChange={(e) => setOrgPhone(e.target.value)}
                  placeholder="+60 12-345 6789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-address">Billing Address</Label>
                <Input
                  id="org-address"
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  placeholder="Enter billing address"
                />
              </div>

              {selectedPlan && (
                <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Selected Plan</h4>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="font-medium">Plan:</span>{" "}
                      {selectedPlan.plan_name}
                    </p>
                    <p>
                      <span className="font-medium">Billing:</span>{" "}
                      {selectedBillingInterval || selectedPlan.billing_interval}
                      {selectedPlan &&
                        (selectedPlan.plan_name
                          .toLowerCase()
                          .includes("personal basic") ||
                          (selectedPlan.plan_name
                            .toLowerCase()
                            .includes("personal") &&
                            selectedPlan.plan_name
                              .toLowerCase()
                              .includes("basic"))) &&
                        selectedBillingInterval === "Month" && (
                          <span className="text-primary ml-1">
                            (7-day trial included)
                          </span>
                        )}
                    </p>
                    <p>
                      <span className="font-medium">Limits:</span>{" "}
                      {selectedPlan.max_devices} devices,{" "}
                      {selectedPlan.included_messages.toLocaleString()}{" "}
                      messages, {selectedPlan.included_data_mb} MB
                    </p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowOrgDialog(false);
                  setSelectedBillingInterval("");
                  setSelectedOrgType("");
                  setOrgTypeError("");
                  setOrgName("");
                  setOrgEmail("");
                  setOrgPhone("");
                  setOrgAddress("");
                }}
                disabled={creatingOrg}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProceedToCheckout}
                disabled={
                  !selectedBillingInterval ||
                  !selectedOrgType ||
                  !orgName.trim() ||
                  creatingOrg
                }
              >
                Proceed to checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <InvoicePrintView
          invoice={invoiceForPrint}
          organizationName={mySubscriptions[0]?.organization ?? ""}
          planName={
            mySubscriptions.find(
              (s) =>
                (s.status || "").toString() === "Active" ||
                (s.status || "").toString() === "Trialling",
            )?.plan_details?.plan_name ?? mySubscriptions[0]?.plan
          }
        />
      </SidebarInset>
    </SidebarProvider>
  );
};

const SubscriptionPage = () => {
  return (
    <Suspense
      fallback={
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <Header />
            <div className="flex flex-1 flex-col gap-4 p-6 animate-in fade-in-0 duration-200">
              <div className="mx-auto w-full max-w-7xl space-y-12">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
                  <Skeleton className="h-5 w-full max-w-2xl mx-auto md:mx-0" />
                  <Skeleton className="h-5 w-full max-w-xl mx-auto md:mx-0" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-[320px] rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      }
    >
      <SubscriptionPageInner />
    </Suspense>
  );
};

export default SubscriptionPage;
