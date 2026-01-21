// Re-export all API functions for convenient importing
// This maintains backward compatibility with existing imports

// Auth
export { loginWithERPNext } from "./auth/auth";

// Tenant
export {
  fetchERPNextTenants,
  createERPNextTenant,
  updateERPNextTenant,
  deleteERPNextTenant,
} from "./tenant/tenant";

// Application
export {
  fetchERPNextApplications,
  createERPNextApplication,
  updateERPNextApplication,
  deleteERPNextApplication,
} from "./application/application";

// Device Profile
export {
  fetchERPNextDeviceProfiles,
  createERPNextDeviceProfile,
  updateERPNextDeviceProfile,
  deleteERPNextDeviceProfile,
} from "./device-profile/device-profile";

// Device
export {
  listERPNextDevices,
  fetchERPNextDevices,
  getERPNextDevice,
  createERPNextDevice,
  updateERPNextDevice,
  deleteERPNextDevice,
} from "./device/device";

// Gateway
export {
  fetchERPNextGateways,
  listERPNextGateways,
  getERPNextGateway,
  syncERPNextGateways,
} from "./gateway/gateway";

// Streams
export { streamGatewayFrames, streamDeviceEvents } from "./streams/streams";

// Re-export utilities
export { getERPNextToken } from "./utils/token";
