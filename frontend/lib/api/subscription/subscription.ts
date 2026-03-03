import { getERPNextToken } from "../utils/token";

// Subscription Plan types (built-in ERPNext "Subscription Plan")
export interface SubscriptionPlan {
  name: string;
  plan_name: string;
  billing_interval: "Month" | "Year" | "Week" | "Day";
  /** Built-in field: amount charged per billing period (used for Stripe payment) */
  cost?: number;
  max_devices: number;
  included_data_mb: number;
  included_messages: number;
  overage_rate_per_mb: number;
  overage_rate_per_1k_messages: number;
  /** @deprecated Use cost. Kept for backward compatibility. */
  plan_price?: number;
}

// Subscription types (built-in ERPNext "Subscription": Trialling, Active, Past Due Date, Cancelled, Unpaid, Completed)
export interface Subscription {
  name: string;
  organization: string;
  plan: string;
  start_date: string;
  end_date: string;
  status:
    | "Active"
    | "Trialling"
    | "Suspended"
    | "Cancelled"
    | "Past Due Date"
    | "Unpaid"
    | "Completed";
  /** Derived from cancel_at_period_end (auto_renew = 1 when cancel_at_period_end = 0) */
  auto_renew?: number;
  cancel_at_period_end?: number;
  plan_details?: {
    plan_name: string;
    billing_interval: string;
    max_devices: number;
    included_data_mb: number;
    included_messages: number;
    overage_rate_per_mb: number;
    overage_rate_per_1k_messages: number;
    /** Built-in plan cost */
    cost?: number;
    /** @deprecated Use cost */
    plan_price?: number;
  };
  /** From create_subscription (plan cost) or backend; used for display and payment */
  plan_price?: number;
  usage?: {
    message_count: number;
    data_usage_mb: number;
    device_count: number;
  };
  trial?: {
    is_trial: boolean;
    trial_start_date?: string;
    trial_end_date?: string;
    trial_expired: boolean;
  };
  trial_start_date?: string;
  trial_end_date?: string;
  is_trial?: boolean;
}

// Organization types
export interface Organization {
  name: string;
  organization_name: string;
  organization_type: "Customer" | "Government" | "System Owner Company";
  billing_address?: string;
  contact_email?: string;
  contact_phone?: string;
}

// Billing history item (from Payment Request list)
export interface BillingHistoryItem {
  name: string;
  creation: string;
  status: string;
  grand_total?: number;
  currency?: string;
  reference_doctype?: string;
  reference_name?: string;
  subject?: string;
  party?: string;
}

// Create a subscription plan (built-in Subscription Plan: use "cost" for price)
export async function createSubscriptionPlan(data: {
  plan_name: string;
  billing_interval: "Monthly" | "Yearly";
  max_devices: number;
  included_data_mb: number;
  included_messages: number;
  overage_rate_per_mb?: number;
  overage_rate_per_1k_messages?: number;
  /** Built-in field */
  cost?: number;
  /** @deprecated Use cost */
  plan_price?: number;
}): Promise<{
  success: boolean;
  data: SubscriptionPlan;
}> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first.",
      );
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token.startsWith("Token ")) {
      headers["Authorization"] = token;
    } else if (token.includes(":")) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      headers["Cookie"] = `sid=${token}`;
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch("/api/erpnext/subscription/plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: any = { message: "Failed to create subscription plan" };

      try {
        errorData = await response.json();
        if (errorData.message && typeof errorData.message === "object") {
          errorData.message =
            errorData.message.exc_message ||
            errorData.message.message ||
            JSON.stringify(errorData.message);
        }
      } catch {
        errorData = {
          message: errorText || "Failed to create subscription plan",
        };
      }

      throw new Error(errorData.message);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to create subscription plan:", error);
    throw error;
  }
}

// Get all subscription plans
export async function getSubscriptionPlans(): Promise<{
  success: boolean;
  data: SubscriptionPlan[];
  total: number;
}> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first.",
      );
    }

    const response = await fetch("/api/erpnext/subscription/plans", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to get subscription plans",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get subscription plans:", error);
    throw error;
  }
}

// Create a new subscription
export async function createSubscription(data: {
  organization: string;
  plan: string;
  start_date?: string;
  auto_renew?: number;
}): Promise<{
  success: boolean;
  message: string;
  data: Subscription;
}> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first.",
      );
    }

    const response = await fetch("/api/erpnext/subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: any = { message: "Failed to create subscription" };

      try {
        errorData = await response.json();
      } catch {
        errorData = { message: errorText || "Failed to create subscription" };
      }

      const errorMessage =
        errorData.message ||
        errorData.exc_message ||
        `HTTP ${response.status}: ${errorText}`;

      console.error("Subscription creation error:", {
        status: response.status,
        errorMessage,
        errorData,
      });

      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to create subscription:", error);
    throw error;
  }
}

// Get subscription details
export async function getSubscription(subscriptionId: string): Promise<{
  success: boolean;
  data: Subscription;
}> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first.",
      );
    }

    const response = await fetch(
      `/api/erpnext/subscription/${subscriptionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to get subscription",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get subscription:", error);
    throw error;
  }
}

/**
 * Get all data for the Subscription page in ONE call.
 * No flash: show loading until this returns, then render "My Subscriptions" or "All Plans" based on has_subscription.
 * Also supports cancelled state + resubscribe via has_active_subscription/can_subscribe.
 */
export async function getSubscriptionPageData(): Promise<{
  success: boolean;
  has_subscription: boolean;
  has_active_subscription: boolean;
  can_subscribe: boolean;
  organizations: Array<{
    name: string;
    organization_name: string;
    subscriptions: Subscription[];
  }>;
  organizations_for_subscribe: Array<{
    name: string;
    organization_name: string;
  }>;
  plans: SubscriptionPlan[];
}> {
  const token = await getERPNextToken();
  if (!token) {
    throw new Error(
      "ERPNext authentication token not found. Please login first.",
    );
  }
  const response = await fetch("/api/erpnext/subscription/page-data", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to get subscription page data",
    }));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`,
    );
  }
  const data = await response.json();
  const organizations = (data.organizations || []).map(
    (org: {
      name: string;
      organization_name: string;
      subscriptions: Record<string, unknown>[];
    }) => ({
      name: org.name,
      organization_name: org.organization_name || org.name,
      subscriptions: (org.subscriptions || []).map(
        (s: Record<string, unknown>) => mapSubscriptionFromByOrganizations(s),
      ),
    }),
  );
  const plans = (data.plans || []).map((p: Record<string, unknown>) =>
    mapPlanFromPageData(p),
  );
  return {
    success: data.success !== false,
    has_subscription: Boolean(data.has_subscription),
    has_active_subscription: Boolean(data.has_active_subscription),
    can_subscribe: Boolean(data.can_subscribe),
    organizations,
    organizations_for_subscribe: (data.organizations_for_subscribe ||
      []) as Array<{ name: string; organization_name: string }>,
    plans,
  };
}

function mapPlanFromPageData(p: Record<string, unknown>): SubscriptionPlan {
  return {
    name: (p.name as string) || "",
    plan_name: (p.plan_name as string) || "",
    billing_interval:
      (p.billing_interval as SubscriptionPlan["billing_interval"]) || "Month",
    cost: typeof p.cost === "number" ? p.cost : undefined,
    plan_price: typeof p.cost === "number" ? p.cost : undefined,
    max_devices: typeof p.max_devices === "number" ? p.max_devices : 0,
    included_data_mb:
      typeof p.included_data_mb === "number" ? p.included_data_mb : 0,
    included_messages:
      typeof p.included_messages === "number" ? p.included_messages : 0,
    overage_rate_per_mb:
      typeof p.overage_rate_per_mb === "number" ? p.overage_rate_per_mb : 0,
    overage_rate_per_1k_messages:
      typeof p.overage_rate_per_1k_messages === "number"
        ? p.overage_rate_per_1k_messages
        : 0,
  };
}

/**
 * Get all organizations for the current user in one call.
 * Use with getSubscriptionsByOrganizations to load user subscriptions in 2 calls instead of 1 + N.
 */
export async function getOrganizationsByUser(): Promise<{
  success: boolean;
  data: Array<{
    name: string;
    organization_name?: string;
    organization_type?: string;
    contact_email?: string;
    contact_phone?: string;
    billing_address?: string;
    modified?: string;
  }>;
  total: number;
}> {
  const token = await getERPNextToken();
  if (!token) {
    throw new Error(
      "ERPNext authentication token not found. Please login first.",
    );
  }
  const response = await fetch("/api/erpnext/organization/by-user", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to get organizations",
    }));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`,
    );
  }
  const data = await response.json();
  return {
    success: data.success !== false,
    data: data.data || [],
    total: data.total ?? data.data?.length ?? 0,
  };
}

/**
 * Get all subscriptions for multiple organizations in one call.
 * Returns subscriptions grouped by organization; flatten with flattenSubscriptionsByOrganizations() for a single list.
 */
export async function getSubscriptionsByOrganizations(
  organizationNames: string[],
): Promise<{
  success: boolean;
  organizations: Array<{
    name: string;
    organization_name: string;
    subscriptions: Subscription[];
  }>;
}> {
  if (!organizationNames.length) {
    return { success: true, organizations: [] };
  }
  const token = await getERPNextToken();
  if (!token) {
    throw new Error(
      "ERPNext authentication token not found. Please login first.",
    );
  }
  const response = await fetch("/api/erpnext/subscription/by-organizations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({ organizations: organizationNames }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to get subscriptions by organizations",
    }));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`,
    );
  }
  const data = await response.json();
  const organizations = (data.organizations || []).map(
    (org: {
      name: string;
      organization_name: string;
      subscriptions: Record<string, unknown>[];
    }) => ({
      name: org.name,
      organization_name: org.organization_name || org.name,
      subscriptions: (org.subscriptions || []).map(
        (s: Record<string, unknown>) => mapSubscriptionFromByOrganizations(s),
      ),
    }),
  );
  return { success: data.success !== false, organizations };
}

/** Map subscription shape from get_subscriptions_by_organizations to Subscription type. */
function mapSubscriptionFromByOrganizations(
  s: Record<string, unknown>,
): Subscription {
  const planName = (s.plan_name as string) ?? (s.plan as string);
  const billingInterval = (s.billing_interval as string) || "";
  const maxDevices = typeof s.max_devices === "number" ? s.max_devices : 0;
  return {
    name: (s.name as string) || "",
    organization: (s.organization as string) || "",
    plan: (s.plan as string) || "",
    start_date: (s.start_date as string) || "",
    end_date: (s.end_date as string) || "",
    status: (s.status as Subscription["status"]) || "Active",
    auto_renew: s.auto_renew as number | undefined,
    cancel_at_period_end: s.cancel_at_period_end as number | undefined,
    plan_details: {
      plan_name: planName || "",
      billing_interval: billingInterval,
      max_devices: maxDevices,
      included_data_mb: 0,
      included_messages: 0,
      overage_rate_per_mb: 0,
      overage_rate_per_1k_messages: 0,
    },
    usage: {
      device_count:
        typeof s.active_device_count === "number" ? s.active_device_count : 0,
      message_count: 0,
      data_usage_mb: 0,
    },
  };
}

/**
 * Flatten organizations with subscriptions into a single Subscription[] (e.g. for "my subscriptions" list).
 */
export function flattenSubscriptionsByOrganizations(
  organizations: Array<{
    name: string;
    organization_name: string;
    subscriptions: Subscription[];
  }>,
): Subscription[] {
  const all: Subscription[] = [];
  for (const org of organizations) {
    for (const sub of org.subscriptions || []) {
      all.push(sub);
    }
  }
  return all;
}

/**
 * Get billing history (Payment Requests) for an organization or a subscription.
 * Uses /api/erpnext/billing-history?organization=... or ?subscription=...
 */
export async function getBillingHistory(options: {
  organization?: string;
  subscription?: string;
}): Promise<{ data: BillingHistoryItem[] }> {
  const { organization, subscription } = options;
  if (!organization && !subscription) {
    return { data: [] };
  }
  const token = await getERPNextToken();
  if (!token) {
    throw new Error("Authentication token not found");
  }
  const params = new URLSearchParams();
  if (organization) params.set("organization", organization);
  if (subscription) params.set("subscription", subscription);
  const response = await fetch(
    `/api/erpnext/billing-history?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    },
  );
  if (!response.ok) {
    const err = await response
      .json()
      .catch(() => ({ message: "Failed to load billing history" }));
    throw new Error(err.message || "Failed to load billing history");
  }
  const json = await response.json();
  return { data: json.data || [] };
}

/**
 * Update subscription status via xpert_lora_app.api.update_subscription_status.
 * When status is "Cancelled", backend also updates related Payment Request and Payment Transaction Log to Cancelled.
 */
export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: "Active" | "Suspended" | "Cancelled",
): Promise<{
  success: boolean;
  message: string;
  data: Subscription;
}> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first.",
      );
    }

    const response = await fetch(
      `/api/erpnext/subscription/${subscriptionId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to update subscription status",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to update subscription status:", error);
    throw error;
  }
}

/** Delete a subscription (e.g. after it is cancelled). */
export async function deleteSubscription(
  subscriptionId: string,
): Promise<{ success?: boolean; message?: string }> {
  try {
    const token = await getERPNextToken();
    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first.",
      );
    }
    const response = await fetch(
      `/api/erpnext/subscription/${encodeURIComponent(subscriptionId)}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      },
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to delete subscription",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }
    const data = await response.json().catch(() => ({}));
    return data.message ?? data ?? { success: true };
  } catch (error) {
    console.error("Failed to delete subscription:", error);
    throw error;
  }
}

// Validate subscription
export async function validateSubscription(subscriptionId: string): Promise<{
  success: boolean;
  is_valid: boolean;
  status: string;
  reasons: string[];
  warnings: string[];
  subscription_id: string;
  plan: string;
  device_count: number;
  max_devices: number;
  usage: {
    message_count: number;
    data_usage_mb: number;
    included_messages: number;
    included_data_mb: number;
  };
  trial: {
    is_trial: boolean;
    trial_end_date?: string;
    trial_expired: boolean;
  };
}> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first.",
      );
    }

    const response = await fetch(
      `/api/erpnext/subscription/${subscriptionId}/validate`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to validate subscription",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to validate subscription:", error);
    throw error;
  }
}

/** Response when getting a Payment Request for a subscription (for Stripe checkout) */
export interface PaymentRequestForSubscriptionResponse {
  payment_request: string;
  amount?: number;
  currency?: string;
}

/**
 * Get or create a Payment Request for a subscription.
 * Use the returned payment_request name to redirect to /pages/pay/{payment_request} for Stripe payment.
 * Backend (built-in) implements get_payment_request_for_subscription(subscription_name, amount).
 * Pass amount when the Subscription Plan has no cost (e.g. from frontend/plan).
 */
export async function getPaymentRequestForSubscription(
  subscriptionName: string,
  amount?: number,
): Promise<PaymentRequestForSubscriptionResponse> {
  const token = await getERPNextToken();
  if (!token) {
    throw new Error(
      "ERPNext authentication token not found. Please login first.",
    );
  }

  const body: { subscription_name: string; amount?: number } = {
    subscription_name: subscriptionName,
  };
  if (amount != null && amount > 0) body.amount = amount;

  const response = await fetch("/api/erpnext/subscription/payment-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to get payment request for subscription",
    }));
    const msg =
      typeof errorData.message === "string"
        ? errorData.message
        : errorData.message?.message || "Failed to get payment request";
    throw new Error(msg);
  }

  const data = await response.json();
  if (!data.payment_request) {
    throw new Error("Invalid response: payment_request is required");
  }
  return data as PaymentRequestForSubscriptionResponse;
}

// Update a subscription plan (built-in: use "cost" for price)
export async function updateSubscriptionPlan(
  planId: string,
  data: {
    plan_name?: string;
    billing_interval?: "Monthly" | "Yearly";
    max_devices?: number;
    included_data_mb?: number;
    included_messages?: number;
    overage_rate_per_mb?: number;
    overage_rate_per_1k_messages?: number;
    cost?: number;
    plan_price?: number;
  },
): Promise<{
  success: boolean;
  data: SubscriptionPlan;
}> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first.",
      );
    }

    const response = await fetch(`/api/erpnext/subscription/plan/${planId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: any = { message: "Failed to update subscription plan" };

      try {
        errorData = await response.json();
        if (errorData.message && typeof errorData.message === "object") {
          errorData.message =
            errorData.message.exc_message ||
            errorData.message.message ||
            JSON.stringify(errorData.message);
        }
      } catch {
        errorData = {
          message: errorText || "Failed to update subscription plan",
        };
      }

      throw new Error(errorData.message);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to update subscription plan:", error);
    throw error;
  }
}

// Delete a subscription plan
export async function deleteSubscriptionPlan(planId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first.",
      );
    }

    const response = await fetch(`/api/erpnext/subscription/plan/${planId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorData: any = { message: "Failed to delete subscription plan" };

      try {
        errorData = await response.json();
        if (errorData.message && typeof errorData.message === "object") {
          errorData.message =
            errorData.message.exc_message ||
            errorData.message.message ||
            JSON.stringify(errorData.message);
        }
      } catch {
        errorData = {
          message: errorText || "Failed to delete subscription plan",
        };
      }

      throw new Error(errorData.message);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to delete subscription plan:", error);
    throw error;
  }
}
