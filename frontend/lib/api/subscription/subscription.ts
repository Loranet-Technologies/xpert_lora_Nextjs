import { getERPNextToken } from "../utils/token";

// Subscription Plan types
export interface SubscriptionPlan {
  name: string;
  plan_name: string;
  billing_interval: "Monthly" | "Yearly";
  max_devices: number;
  included_data_mb: number;
  included_messages: number;
  overage_rate_per_mb: number;
  overage_rate_per_1k_messages: number;
}

// Subscription types
export interface Subscription {
  name: string;
  organization: string;
  plan: string;
  start_date: string;
  end_date: string;
  status: "Active" | "Suspended" | "Cancelled";
  auto_renew: number;
  plan_details?: {
    plan_name: string;
    billing_interval: string;
    max_devices: number;
    included_data_mb: number;
    included_messages: number;
    overage_rate_per_mb: number;
    overage_rate_per_1k_messages: number;
  };
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

// Subscription Device types
export interface SubscriptionDevice {
  name: string;
  subscription: string;
  device: string;
  start_date: string;
  end_date?: string;
  status: "Active" | "Suspended" | "Expired";
  device_name?: string;
  dev_eui?: string;
  device_status?: string;
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

// Create a subscription plan
export async function createSubscriptionPlan(data: {
  plan_name: string;
  billing_interval: "Monthly" | "Yearly";
  max_devices: number;
  included_data_mb: number;
  included_messages: number;
  overage_rate_per_mb?: number;
  overage_rate_per_1k_messages?: number;
}): Promise<{
  success: boolean;
  data: SubscriptionPlan;
}> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
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
        "ERPNext authentication token not found. Please login first."
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
        errorData.message || `HTTP error! status: ${response.status}`
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
        "ERPNext authentication token not found. Please login first."
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
        "ERPNext authentication token not found. Please login first."
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
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to get subscription",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get subscription:", error);
    throw error;
  }
}

// Get all subscriptions for an organization
export async function getOrganizationSubscriptions(
  organizationId: string
): Promise<{
  success: boolean;
  organization: string;
  data: Subscription[];
  total: number;
}> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    const response = await fetch(
      `/api/erpnext/subscription/organization/${organizationId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to get organization subscriptions",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get organization subscriptions:", error);
    throw error;
  }
}

// Attach device to subscription
export async function attachDeviceToSubscription(data: {
  subscription: string;
  device: string;
  start_date?: string;
}): Promise<{
  success: boolean;
  message: string;
  data: SubscriptionDevice;
  device_count: number;
  max_devices: number;
}> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    const response = await fetch("/api/erpnext/subscription/attach-device", {
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
      let errorData: any = { message: "Failed to attach device" };

      try {
        errorData = await response.json();
      } catch {
        errorData = { message: errorText || "Failed to attach device" };
      }

      const errorMessage =
        errorData.message ||
        errorData.exc_message ||
        `HTTP ${response.status}: ${errorText}`;

      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to attach device:", error);
    throw error;
  }
}

// Remove device from subscription
export async function removeDeviceFromSubscription(
  subscriptionDeviceId: string,
  action: "disable" | "delete" = "disable"
): Promise<{
  success: boolean;
  message: string;
  action: string;
}> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    const response = await fetch(
      `/api/erpnext/subscription/device/${subscriptionDeviceId}?action=${action}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to remove device",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to remove device:", error);
    throw error;
  }
}

// Get subscription devices
export async function getSubscriptionDevices(subscriptionId: string): Promise<{
  success: boolean;
  subscription: string;
  subscription_status: string;
  plan_name: string;
  max_devices: number;
  data: SubscriptionDevice[];
  total: number;
  active_count: number;
}> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    const response = await fetch(
      `/api/erpnext/subscription/${subscriptionId}/devices`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to get subscription devices",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get subscription devices:", error);
    throw error;
  }
}

// Update subscription status
export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: "Active" | "Suspended" | "Cancelled"
): Promise<{
  success: boolean;
  message: string;
  data: Subscription;
}> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
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
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to update subscription status",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to update subscription status:", error);
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
        "ERPNext authentication token not found. Please login first."
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
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to validate subscription",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to validate subscription:", error);
    throw error;
  }
}

// Update a subscription plan
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
  }
): Promise<{
  success: boolean;
  data: SubscriptionPlan;
}> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
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
        "ERPNext authentication token not found. Please login first."
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

// Get subscription device by device ID
export async function getSubscriptionDeviceByDevice(deviceId: string): Promise<{
  success: boolean;
  data: SubscriptionDevice | null;
  subscription?: Subscription;
}> {
  try {
    const token = await getERPNextToken();

    if (!token) {
      throw new Error(
        "ERPNext authentication token not found. Please login first."
      );
    }

    // Query Subscription Device resource by device
    const response = await fetch(
      `/api/erpnext/subscription-device?device=${deviceId}&status=Active`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      // If not found, return null (device not attached)
      if (response.status === 404) {
        return { success: true, data: null };
      }
      const errorData = await response.json().catch(() => ({
        message: "Failed to get subscription device",
      }));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();

    // If we have a subscription device, also fetch subscription details
    if (result.data && result.data.subscription) {
      try {
        const subscription = await getSubscription(result.data.subscription);
        return {
          success: true,
          data: result.data,
          subscription: subscription.data,
        };
      } catch {
        // If subscription fetch fails, still return the device
        return { success: true, data: result.data };
      }
    }

    return { success: true, data: result.data || null };
  } catch (error) {
    console.error("Failed to get subscription device:", error);
    // Return null on error (device not attached or error)
    return { success: false, data: null };
  }
}
