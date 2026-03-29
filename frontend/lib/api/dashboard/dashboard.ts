import { getERPNextToken } from "../utils/token";

/** Shared React Query key for dashboard summary (subscription access + dashboard page). */
export const DASHBOARD_SUMMARY_QUERY_KEY = ["dashboard-summary"] as const;

export interface DashboardSummaryResponse {
  success: boolean;
  organization: string | null;
  account_status: "Pending" | "Active" | "Suspended" | string;
  subscription: {
    id: string | null;
    status: string | null;
    plan_id: string | null;
    plan_name: string | null;
    billing_interval: string | null;
    start_date: string | null;
    end_date: string | null;
    trial_start_date: string | null;
    trial_end_date: string | null;
    auto_renew: number;
  };
  usage: {
    devices_used: number;
    device_limit: number | null;
    messages_used: number;
    messages_limit: number;
    data_used_mb: number;
    data_limit_mb: number;
  };
  payment: {
    status: string;
    last_payment_date: string | null;
    next_due_date: string | null;
    outstanding_amount: number;
    currency: string | null;
  };
}

export interface DashboardNotification {
  type: "info" | "warning" | "error" | string;
  code?: string;
  title: string;
  message: string;
}

export interface DashboardNotificationsResponse {
  success: boolean;
  organization: string | null;
  notifications: DashboardNotification[];
  total: number;
}

export async function getDashboardSummary(params?: {
  organization?: string;
}): Promise<DashboardSummaryResponse> {
  const token = await getERPNextToken();
  if (!token) {
    throw new Error("ERPNext authentication token not found. Please login first.");
  }

  const searchParams = new URLSearchParams();
  if (params?.organization) {
    searchParams.set("organization", params.organization);
  }

  const response = await fetch(
    `/api/erpnext/dashboard/summary${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
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
      message: "Failed to get dashboard summary",
    }));
    throw new Error(
      errorData.message || errorData.error || "Failed to get dashboard summary",
    );
  }

  return response.json();
}

export async function getDashboardNotifications(params?: {
  organization?: string;
  days_ahead?: number;
}): Promise<DashboardNotificationsResponse> {
  const token = await getERPNextToken();
  if (!token) {
    throw new Error("ERPNext authentication token not found. Please login first.");
  }

  const searchParams = new URLSearchParams();
  if (params?.organization) {
    searchParams.set("organization", params.organization);
  }
  if (params?.days_ahead != null) {
    searchParams.set("days_ahead", String(params.days_ahead));
  }

  const response = await fetch(
    `/api/erpnext/dashboard/notifications${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
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
      message: "Failed to get dashboard notifications",
    }));
    throw new Error(
      errorData.message ||
        errorData.error ||
        "Failed to get dashboard notifications",
    );
  }

  return response.json();
}
