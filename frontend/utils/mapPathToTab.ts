export const mapPathToTab = (pathname: string): string => {
  if (pathname === "/") return "dashboard";
  if (pathname.startsWith("/pages/dashboard")) return "dashboard";
  if (pathname.startsWith("/pages/organizations")) return "organizations";
  if (pathname.startsWith("/pages/applications")) return "applications";
  if (pathname.startsWith("/pages/settings")) return "settings";
  if (pathname.startsWith("/pages/deviceProfile")) return "deviceProfile";
  if (pathname.startsWith("/pages/devices")) return "devices";
  if (pathname.startsWith("/pages/gateways")) return "gateways";
  if (pathname.startsWith("/pages/subscription")) return "subscription";
  if (pathname.startsWith("/pages/subscription-management"))
    return "subscriptionManagement";
  if (pathname.startsWith("/pages/subscription-dashboard"))
    return "subscriptionDashboard";
  if (pathname.startsWith("/pages/users")) return "users";
  if (pathname.startsWith("/pages/activity-logs")) return "activityLogs";
  if (pathname.startsWith("/pages/payment-billing-logs"))
    return "paymentBillingLogs";
  if (pathname.startsWith("/pages/merchants")) return "merchants";
  return "dashboard"; // Default to 'dashboard' if no match is found
};
