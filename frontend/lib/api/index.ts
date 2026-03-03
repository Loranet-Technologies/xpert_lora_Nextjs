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

// Payment (Stripe Payment Intent for Payment Request)
export {
  createPaymentIntent,
  getPaymentRequestStatus,
  createPaymentIntentForPlan,
  getPaymentStatus,
  type CreatePaymentIntentResponse,
  type PaymentRequestStatus,
  type CreatePaymentIntentForPlanResponse,
  type PaymentStatusResponse,
} from "./payment/payment";

// Merchant & Merchant Gateway Account & Payment Transaction Log
export {
  listMerchants,
  getMerchant,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  listMerchantGatewayAccounts,
  getMerchantGatewayAccount,
  createMerchantGatewayAccount,
  updateMerchantGatewayAccount,
  deleteMerchantGatewayAccount,
  listPaymentTransactionLogs,
  type Merchant,
  type MerchantGatewayAccount,
  type PaymentTransactionLog,
} from "./merchant/merchant";

// Organization
export {
  createOrganization,
  type CreateOrganizationData,
} from "./organization/organization";

// Re-export utilities
export { getERPNextToken } from "./utils/token";
