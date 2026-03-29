import type { DashboardSummaryResponse } from "@/lib/api/dashboard/dashboard";

/**
 * ERPNext Subscription statuses that grant product access.
 * Mirrors xpert_lora_app.subscription_enforcement.SUBSCRIPTION_ACTIVE_STATUSES.
 */
export const SUBSCRIPTION_ACTIVE_STATUSES = ["Active", "Trialling"] as const;

const ACTIVE_LOWER = new Set(
  SUBSCRIPTION_ACTIVE_STATUSES.map((s) => s.toLowerCase()),
);

export function subscriptionStatusAllowsAccess(
  status: string | null | undefined,
): boolean {
  if (!status?.trim()) return false;
  return ACTIVE_LOWER.has(status.trim().toLowerCase());
}

/**
 * Dashboard: show Suspended when there is a subscription row but it is not active/trialling.
 * Mirrors account_should_show_suspended.
 */
export function accountShouldShowSuspended(
  subscriptionStatus: string | null | undefined,
): boolean {
  if (!subscriptionStatus?.trim()) return false;
  return !subscriptionStatusAllowsAccess(subscriptionStatus);
}

/**
 * True when the customer dashboard indicates the account cannot use paid product features
 * (payment required / subscription not Active or Trialling).
 */
export function isProductAccessSuspendedFromSummary(
  summary: DashboardSummaryResponse | null | undefined,
): boolean {
  if (!summary || summary.success === false) return false;
  const acct = (summary.account_status || "").trim().toLowerCase();
  if (acct === "suspended") return true;
  const subStatus = summary.subscription?.status;
  if (subStatus?.trim() && !subscriptionStatusAllowsAccess(subStatus)) {
    return true;
  }
  return false;
}

/**
 * Paths users may open while suspended (billing, recovery, dashboard, settings).
 * Aligns with exempt API surface: summary, notifications, subscription/payment flows.
 */
export const SUBSCRIPTION_RECOVERY_PATH_PREFIXES = [
  "/pages/dashboard",
  "/pages/subscription",
  "/pages/settings",
  "/pages/checkout",
  "/pages/pay/",
] as const;

export function isSubscriptionRecoveryPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/" || pathname.startsWith("/register")) return true;
  return SUBSCRIPTION_RECOVERY_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  );
}
