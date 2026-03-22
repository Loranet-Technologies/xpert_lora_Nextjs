/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

// Base URLs
const ERPNext_BASE_URL =
  process.env.NEXT_PUBLIC_ERPNEXT_URL || "https://erp.xperts.loranet.my";

const KEYCLOAK_BASE_URL =
  process.env.NEXT_PUBLIC_KEYCLOAK_URL || "https://keycloak.loranet.my";

const KEYCLOAK_REALM =
  process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "loranet_xperts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";

// ERPNext API URLs
export const ERPNEXT_API_URLS = {
  // Authentication
  LOGIN: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.login`,
  LOGOUT: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.logout`,
  SSO_LOGIN: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.sso_login`,
  FRAPPE_LOGOUT: `${ERPNext_BASE_URL}/api/method/frappe.auth.logout`,

  // Application endpoints
  LIST_APPLICATIONS: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.list_applications`,
  GET_APPLICATION: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_application`,
  CREATE_APPLICATION: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.create_application`,
  UPDATE_APPLICATION: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.update_application`,
  DELETE_APPLICATION: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.delete_application`,
  APPLICATION_RESOURCE: `${ERPNext_BASE_URL}/api/resource/Application`,

  // Device endpoints
  LIST_DEVICES: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.list_devices`,
  GET_DEVICE: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_device`,
  CREATE_DEVICE: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.create_device`,
  UPDATE_DEVICE: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.update_device`,
  DELETE_DEVICE: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.delete_device`,
  /** Device limit from subscription (current_count, device_limit, has_active_subscription). */
  GET_DEVICE_LIMIT_INFO: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_device_limit_info`,
  DEVICE_RESOURCE: `${ERPNext_BASE_URL}/api/resource/Device`,

  // Device Profile endpoints
  LIST_DEVICE_PROFILES: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.list_device_profiles`,
  GET_DEVICE_PROFILE: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_device_profile`,
  CREATE_DEVICE_PROFILE: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.create_device_profile`,
  UPDATE_DEVICE_PROFILE: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.update_device_profile`,
  DELETE_DEVICE_PROFILE: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.delete_device_profile`,
  GET_DEVICE_PROFILE_DECODERS: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_device_profile_decoders`,
  DEVICE_PROFILE_RESOURCE: `${ERPNext_BASE_URL}/api/resource/Device Profile`,

  // Gateway endpoints
  LIST_GATEWAYS: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.list_gateways`,
  GET_GATEWAY: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_gateway`,
  CREATE_GATEWAY: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.create_gateway`,
  UPDATE_GATEWAY: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.update_gateway`,
  DELETE_GATEWAY: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.delete_gateway`,
  SYNC_GATEWAY: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.sync_gateway`,
  SYNC_GATEWAYS: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.sync_gateways`,
  GATEWAY_RESOURCE: `${ERPNext_BASE_URL}/api/resource/Gateway`,

  // Tenant endpoints
  LIST_TENANTS: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.list_tenants`,
  GET_TENANT: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_tenant`,
  CREATE_TENANT: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.create_tenant`,
  UPDATE_TENANT: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.update_tenant`,
  DELETE_TENANT: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.delete_tenant`,
  TENANT_RESOURCE: `${ERPNext_BASE_URL}/api/resource/Tenant`,

  // User endpoints
  GET_USER: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_user`,
  GET_USER_DETAILS: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_user_details`,
  LIST_USERS: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.list_users`,
  CREATE_USER: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.create_user`,
  UPDATE_USER: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.update_user`,
  DELETE_USER: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.delete_user`,
  RESET_USER_PASSWORD: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.reset_user_password`,
  CHANGE_PASSWORD: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.change_password`,
  /** Paginated User Activity Log (Admin/SuperAdmin); implement `list_user_activity_logs` in xpert_lora_app.api. */
  LIST_USER_ACTIVITY_LOGS: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.list_user_activity_logs`,
  USER_RESOURCE: `${ERPNext_BASE_URL}/api/resource/User`,

  // Device Events
  GET_DEVICE_EVENTS: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_device_events`,
  DEVICE_EVENTS: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.device_events`,

  // Gateway Frames
  GET_GATEWAY_FRAMES: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_gateway_frames`,
  GATEWAY_FRAMES: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.gateway_frames`,

  // Frappe Auth
  GET_LOGGED_USER: `${ERPNext_BASE_URL}/api/method/frappe.auth.get_logged_user`,

  // Subscription endpoints
  GET_SUBSCRIPTION_PLANS: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_subscription_plans`,
  CREATE_SUBSCRIPTION: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.create_subscription`,
  GET_SUBSCRIPTION: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_subscription`,
  GET_ORGANIZATION_SUBSCRIPTIONS: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_organization_subscriptions`,
  /** Get all organizations for current user (one call). */
  GET_ORGANIZATIONS_BY_USER: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_organizations_by_user`,
  /** Get all subscriptions for multiple organizations (one call). POST body: { organizations: string[] }. */
  GET_SUBSCRIPTIONS_BY_ORGANIZATIONS: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_subscriptions_by_organizations`,
  /** Subscription page: one call returns has_subscription, organizations (with subscriptions), plans. */
  GET_SUBSCRIPTION_PAGE_DATA: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_subscription_page_data`,
  /** Billing history (Payment Requests) for org or subscription. */
  GET_BILLING_HISTORY: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_billing_history`,
  /** Payment Transaction Log list; filters via method args; permission: read on doctype. */
  GET_PAYMENT_BILLING_LOGS: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_payment_billing_logs`,
  /** Subscription dashboard: all KPIs, revenue, metrics, customers, billing, plans, churn, alerts (one call). */
  GET_SUBSCRIPTION_DASHBOARD_ALL: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.subscription_dashboard.get_subscription_dashboard_all`,
  UPDATE_SUBSCRIPTION_STATUS: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.update_subscription_status`,
  VALIDATE_SUBSCRIPTION: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.validate_subscription`,
  SUBSCRIPTION_RESOURCE: `${ERPNext_BASE_URL}/api/resource/Subscription`,
  SUBSCRIPTION_PLAN_RESOURCE: `${ERPNext_BASE_URL}/api/resource/Subscription Plan`,
  ORGANIZATION_RESOURCE: `${ERPNext_BASE_URL}/api/resource/Organization`,

  // Stripe Payment (Payment Request → Payment Intent for frontend)
  // ERPNext: create_stripe_payment_intent(payment_request_name) [allow_guest] → calls create_payment_intent_for_request
  CREATE_STRIPE_PAYMENT_INTENT: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.create_stripe_payment_intent`,

  // Get or create Payment Request for a subscription (so user can pay with Stripe)
  GET_PAYMENT_REQUEST_FOR_SUBSCRIPTION: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_payment_request_for_subscription`,

  // Pay-first: create Payment Intent for plan (no subscription yet); webhook creates subscription on success
  CREATE_PAYMENT_INTENT_FOR_PLAN: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.create_payment_intent_for_plan`,
  // Pay-first: get status for payment request (status, subscription_name, can_pay_again, can_cancel)
  GET_PAYMENT_STATUS: `${ERPNext_BASE_URL}/api/method/xpert_lora_app.api.get_payment_status`,

  // Payment Request resource (for status check after Stripe webhook)
  PAYMENT_REQUEST_RESOURCE: `${ERPNext_BASE_URL}/api/resource/Payment Request`,

  // Merchant & Payment Gateway (Xpert Lora App)
  MERCHANT_RESOURCE: `${ERPNext_BASE_URL}/api/resource/Merchant`,
  MERCHANT_GATEWAY_ACCOUNT_RESOURCE: `${ERPNext_BASE_URL}/api/resource/Merchant Gateway Account`,
  PAYMENT_TRANSACTION_LOG_RESOURCE: `${ERPNext_BASE_URL}/api/resource/Payment Transaction Log`,
};

// Keycloak API URLs
export const KEYCLOAK_API_URLS = {
  TOKEN: `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
  AUTHORIZE: `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth`,
  LOGOUT: `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`,
  USER_INFO: `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
  /** Registration page (requires "User registration" enabled in Keycloak realm) */
  REGISTRATION: `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/registrations`,
};

// Keycloak Configuration (for client ID, secret, etc.)
export const KEYCLOAK_CONFIG = {
  CLIENT_ID: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "loranet_xperts",
  CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET || "",
  REALM: KEYCLOAK_REALM,
  BASE_URL: KEYCLOAK_BASE_URL,
};

// Main API URLs (ChirpStack/LoRaWAN API)
export const API_URLS = {
  // Uplinks
  UPLINKS: `${API_BASE_URL}/uplinks`,
  UPLINK_STATS: `${API_BASE_URL}/uplinks/stats`,
  RECENT_UPLINKS: `${API_BASE_URL}/uplinks/recent`,
  UPLINK_APPLICATIONS: `${API_BASE_URL}/uplinks/applications`,
  UPLINK_DEVICES: `${API_BASE_URL}/uplinks/devices`,
  SIMULATE_UPLINK: `${API_BASE_URL}/uplinks/simulate`,

  // Devices
  DEVICES: `${API_BASE_URL}/devices`,

  // Applications
  APPLICATIONS: `${API_BASE_URL}/applications`,

  // Organizations
  ORGANIZATIONS: `${API_BASE_URL}/api/organizations`,

  // ChirpStack Applications
  CS_APPLICATIONS: `${API_BASE_URL}/api/applications`,

  // ChirpStack Devices
  CS_DEVICES: `${API_BASE_URL}/api/devices`,

  // Downlinks
  DOWNLINKS: `${API_BASE_URL}/api/downlinks`,
  SEND_DOWNLINK: `${API_BASE_URL}/api/downlinks/send`,
  SEND_RAW_DOWNLINK: `${API_BASE_URL}/api/downlinks/send-raw`,
};

// Helper functions for dynamic endpoints (with IDs)
export const getErpNextUrl = {
  APPLICATION_BY_ID: (id: string) =>
    `${ERPNext_BASE_URL}/api/resource/Application/${id}`,
  DEVICE_BY_ID: (id: string) => `${ERPNext_BASE_URL}/api/resource/Device/${id}`,
  DEVICE_PROFILE_BY_ID: (id: string) =>
    `${ERPNext_BASE_URL}/api/resource/Device Profile/${id}`,
  GATEWAY_BY_ID: (id: string) =>
    `${ERPNext_BASE_URL}/api/resource/Gateway/${id}`,
  TENANT_BY_ID: (id: string) => `${ERPNext_BASE_URL}/api/resource/Tenant/${id}`,
  MERCHANT_BY_ID: (id: string) =>
    `${ERPNext_BASE_URL}/api/resource/Merchant/${encodeURIComponent(id)}`,
  MERCHANT_GATEWAY_ACCOUNT_BY_ID: (id: string) =>
    `${ERPNext_BASE_URL}/api/resource/Merchant Gateway Account/${encodeURIComponent(id)}`,
  PAYMENT_REQUEST_BY_ID: (id: string) =>
    `${ERPNext_BASE_URL}/api/resource/Payment Request/${encodeURIComponent(id)}`,
};

export const getApiUrl = {
  UPLINK_DEVICE: (deviceId: string) =>
    `${API_BASE_URL}/uplinks/device/${deviceId}`,
  ORGANIZATION_BY_ID: (id: string) => `${API_BASE_URL}/api/organizations/${id}`,
  CS_APPLICATION_BY_ID: (id: string) =>
    `${API_BASE_URL}/api/applications/${id}`,
  CS_DEVICE_BY_DEVEUI: (devEui: string) =>
    `${API_BASE_URL}/api/devices/${devEui}`,
};

// Export base URLs for convenience
export const BASE_URLS = {
  ERPNEXT: ERPNext_BASE_URL,
  KEYCLOAK: KEYCLOAK_BASE_URL,
  API: API_BASE_URL,
};

// Default export (all configs combined)
export default {
  ERPNEXT_API_URLS,
  KEYCLOAK_API_URLS,
  KEYCLOAK_CONFIG,
  API_URLS,
  BASE_URLS,
  getErpNextUrl,
  getApiUrl,
};
