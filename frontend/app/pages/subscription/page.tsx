"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  getSubscriptionPlans,
  createSubscription,
  type SubscriptionPlan,
  type Subscription,
} from "@/lib/api/subscription/subscription";
import { getERPNextToken } from "@/lib/api/utils/token";

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

const SubscriptionPage = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );
  const [selectedBillingInterval, setSelectedBillingInterval] = useState<
    "Monthly" | "Yearly" | ""
  >("");
  const [showOrgDialog, setShowOrgDialog] = useState(false);
  const [selectedOrgType, setSelectedOrgType] = useState<OrganizationType | "">(
    ""
  );
  const [orgTypeError, setOrgTypeError] = useState("");

  // Organization creation form
  const [orgName, setOrgName] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [creatingSubscription, setCreatingSubscription] = useState(false);

  // Current subscription
  const [currentSubscription, setCurrentSubscription] =
    useState<Subscription | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [isEnterpriseOpen, setIsEnterpriseOpen] = useState(false);

  // Fetch plans on mount
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSubscriptionPlans();
      setPlans(response.data || []);
    } catch (err: any) {
      console.error("Failed to load plans:", err);
      setError(err?.message || "Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  // Create organization
  const createOrganization = async (): Promise<string | null> => {
    try {
      setCreatingOrg(true);
      const token = await getERPNextToken();

      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Validate required fields
      if (!orgName || !orgName.trim()) {
        throw new Error("Organization name is required");
      }

      if (!selectedOrgType) {
        throw new Error("Organization type is required");
      }

      const orgData: any = {
        organization_name: orgName.trim(),
        organization_type: selectedOrgType,
      };

      // Only include optional fields if they have values
      if (orgEmail && orgEmail.trim()) {
        orgData.contact_email = orgEmail.trim();
      }
      if (orgPhone && orgPhone.trim()) {
        orgData.contact_phone = orgPhone.trim();
      }
      if (orgAddress && orgAddress.trim()) {
        orgData.billing_address = orgAddress.trim();
      }

      console.log("Creating organization with data:", orgData);

      // Use Next.js API route to avoid CORS issues
      const response = await fetch("/api/erpnext/organization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(orgData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: "Failed to create organization",
        }));

        const errorMessage =
          errorData.message || `HTTP error! status: ${response.status}`;

        console.error("Organization creation error:", {
          status: response.status,
          errorMessage,
          errorData,
        });

        throw new Error(errorMessage);
      }

      const result = await response.json();
      const orgId = result.data?.name || result.data?.data?.name || result.name;

      if (!orgId) {
        console.error("Organization created but no ID returned:", result);
        throw new Error(
          "Organization created but failed to get organization ID"
        );
      }

      setOrganizationId(orgId);
      return orgId;
    } catch (err: any) {
      console.error("Failed to create organization:", err);
      const errorMessage = err?.message || "Failed to create organization";
      setOrgTypeError(errorMessage);
      setError(errorMessage); // Also set main error for visibility
      return null;
    } finally {
      setCreatingOrg(false);
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setSelectedBillingInterval(plan.billing_interval); // Set default to plan's billing interval
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

  const handleContinue = async () => {
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

    try {
      setCreatingSubscription(true);
      setOrgTypeError("");
      setSuccess(null);

      // Find the plan with matching plan_name and billing_interval
      let planToUse = selectedPlan;
      if (
        selectedPlan &&
        selectedPlan.billing_interval !== selectedBillingInterval
      ) {
        // Look for a plan with the same name but different billing interval
        const matchingPlan = plans.find(
          (p) =>
            p.plan_name === selectedPlan.plan_name &&
            p.billing_interval === selectedBillingInterval
        );

        if (matchingPlan) {
          planToUse = matchingPlan;
        } else {
          setOrgTypeError(
            `Plan "${selectedPlan.plan_name}" with ${selectedBillingInterval} billing is not available. Please select a different billing interval or plan.`
          );
          return;
        }
      }

      // Create organization first
      const orgId = await createOrganization();
      if (!orgId) {
        return;
      }

      // Create subscription
      const subscriptionData = {
        organization: orgId,
        plan: planToUse!.name, // Use plan document name
        auto_renew: 0,
      };

      const result = await createSubscription(subscriptionData);

      setSuccess(
        `Subscription created successfully! ${
          result.data.is_trial
            ? `7-day trial started. Trial ends on ${new Date(
                result.data.trial_end_date!
              ).toLocaleDateString()}.`
            : ""
        }`
      );

      setCurrentSubscription(result.data);
      setShowOrgDialog(false);
      setSelectedPlan(null);
      setSelectedBillingInterval("");
      setSelectedOrgType("");
      setOrgName("");
      setOrgEmail("");
      setOrgPhone("");
      setOrgAddress("");

      // Reload plans
      await loadPlans();
    } catch (err: any) {
      console.error("Failed to create subscription:", err);
      setOrgTypeError(err?.message || "Failed to create subscription");
    } finally {
      setCreatingSubscription(false);
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
        plan.billing_interval === "Monthly"
          ? "Monthly billing"
          : "Yearly billing",
      trial:
        isPersonalBasic && plan.billing_interval === "Monthly"
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

  // Get plan price
  const getPlanPrice = (planName: string, billingInterval: string): string => {
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
      (plan) => !plan.plan_name.toLowerCase().includes("government")
    );

    // Separate Enterprise plans
    const enterprisePlans = filtered.filter((plan) =>
      plan.plan_name.toLowerCase().includes("enterprise")
    );
    const otherPlans = filtered.filter(
      (plan) => !plan.plan_name.toLowerCase().includes("enterprise")
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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="mx-auto w-full max-w-7xl space-y-12">
            {/* Header Section */}
            <div className="text-center space-y-4">
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

            {/* Current Subscription Card */}
            {currentSubscription && (
              <Card className="bg-primary/5 border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Current Subscription
                  </CardTitle>
                  <CardDescription>
                    Your active subscription details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Plan
                      </p>
                      <p className="text-lg font-semibold">
                        {currentSubscription.plan_details?.plan_name ||
                          currentSubscription.plan}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Status
                      </p>
                      <Badge
                        variant={
                          currentSubscription.status === "Active"
                            ? "default"
                            : currentSubscription.status === "Suspended"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {currentSubscription.status}
                      </Badge>
                    </div>
                    {currentSubscription.trial?.is_trial && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Trial
                        </p>
                        <p className="text-lg font-semibold">
                          {currentSubscription.trial.trial_expired
                            ? "Expired"
                            : `Ends ${new Date(
                                currentSubscription.trial.trial_end_date!
                              ).toLocaleDateString()}`}
                        </p>
                      </div>
                    )}
                    {currentSubscription.usage && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Usage
                        </p>
                        <p className="text-sm">
                          {currentSubscription.usage.device_count} /{" "}
                          {currentSubscription.plan_details?.max_devices}{" "}
                          devices
                        </p>
                        <p className="text-sm">
                          {currentSubscription.usage.message_count.toLocaleString()}{" "}
                          /{" "}
                          {currentSubscription.plan_details?.included_messages.toLocaleString()}{" "}
                          messages
                        </p>
                        <p className="text-sm">
                          {currentSubscription.usage.data_usage_mb.toFixed(2)} /{" "}
                          {currentSubscription.plan_details?.included_data_mb}{" "}
                          MB
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pricing Cards */}
            {loading ? (
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
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
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
                      plan.billing_interval
                    );

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
                              {plan.billing_interval === "Monthly"
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
                            disabled={!!currentSubscription}
                          >
                            {currentSubscription
                              ? "Already Subscribed"
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
                                plan.billing_interval
                              );

                              return (
                                <Card
                                  key={plan.name}
                                  className={`relative flex flex-col transition-all hover:shadow-lg ${getPlanColor(
                                    index
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
                                          : plan.billing_interval === "Monthly"
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
                                      disabled={!!currentSubscription}
                                    >
                                      {currentSubscription
                                        ? "Already Subscribed"
                                        : "Select Plan"}
                                      <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                  </CardFooter>
                                </Card>
                              );
                            }
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}
              </>
            )}

            {/* Info Section */}
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
          </div>
        </div>

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
                  selectedBillingInterval === "Monthly" && (
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
                    setSelectedBillingInterval(value as "Monthly" | "Yearly")
                  }
                >
                  <SelectTrigger id="billing-interval" className="w-full">
                    <SelectValue placeholder="Select billing interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Monthly</div>
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
                    <SelectItem value="Yearly">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Yearly</div>
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
                        selectedBillingInterval === "Monthly" && (
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
                disabled={creatingSubscription || creatingOrg}
              >
                Cancel
              </Button>
              <Button
                onClick={handleContinue}
                disabled={
                  !selectedBillingInterval ||
                  !selectedOrgType ||
                  !orgName.trim() ||
                  creatingSubscription ||
                  creatingOrg
                }
              >
                {(creatingSubscription || creatingOrg) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {creatingOrg
                  ? "Creating Organization..."
                  : creatingSubscription
                  ? "Creating Subscription..."
                  : "Create Subscription"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default SubscriptionPage;
