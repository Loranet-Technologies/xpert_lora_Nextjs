export const mapPathToTab = (pathname: string): string => {
  if (pathname === "/") return "dashboard";
  if (pathname.startsWith("/pages/dashboard")) return "dashboard";
  if (pathname.startsWith("/pages/organizations")) return "organizations";
  if (pathname.startsWith("/pages/applications")) return "applications";
  if (pathname.startsWith("/pages/deviceProfile")) return "deviceProfile";
  if (pathname.startsWith("/pages/devices")) return "devices";
  if (pathname.startsWith("/pages/gateway-list")) return "gatewayList";
  if (pathname.startsWith("/pages/gateway")) return "gateway";
  if (pathname.startsWith("/pages/subscription")) return "subscription";
  if (pathname.startsWith("/pages/subscription-management"))
    return "subscriptionManagement";
  if (pathname.startsWith("/pages/users")) return "users";
  return "dashboard"; // Default to 'dashboard' if no match is found
};
