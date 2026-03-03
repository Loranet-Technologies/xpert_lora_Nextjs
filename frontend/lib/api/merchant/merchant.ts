import { getERPNextToken } from "../utils/token";

// Merchant (ERPNext DocType: Merchant)
export interface Merchant {
  name: string;
  merchant_code: string;
  merchant_name: string;
  select?: string; // Organization link
  is_active?: number | boolean;
  default_currency?: string;
  contact_email?: string;
  contact_person?: string;
  contact_phone?: string;
  webhook_url?: string;
  api_version?: string;
  additional_information?: string;
}

// Merchant Gateway Account (ERPNext DocType: Merchant Gateway Account)
export interface MerchantGatewayAccount {
  name: string;
  merchant_id?: string;
  account_name?: string;
  merchant: string; // Link to Merchant (name)
  api_key?: string;
  merchant_secret?: string;
  environment?: "Sandbox" | "Production";
  is_default?: number | boolean;
  currency?: string;
  is_active?: number | boolean;
  payment_gateway?: string;
  webhook_secret?: string;
  settlement_delay_days?: number;
  max_amount?: number;
  min_amount?: number;
  supported_payment_methods?: string;
  additional_configuration?: string;
}

// Payment Transaction Log (ERPNext DocType: Payment Transaction Log) - read-only
export interface PaymentTransactionLog {
  name: string;
  payment_request?: string;
  event_type?: string;
  gateway_event?: string;
  gateway_reference?: string;
  signature_valid?: number | boolean;
  amount?: number;
  currency?: string;
  status?: string;
  merchant?: string;
  payment_gateway?: string;
  organization?: string;
  timestamp?: string;
  is_processed?: number | boolean;
  error_message?: string;
}

async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getERPNextToken();
  if (!token) {
    throw new Error("Authentication required. Please log in.");
  }
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };
  return fetch(url, { ...options, headers, credentials: "include" });
}

async function throwOnNotOk(
  response: Response,
  fallbackMessage: string
): Promise<void> {
  if (!response.ok) {
    const d = await response.json().catch(() => ({}));
    const msg =
      typeof d?.message === "string"
        ? d.message
        : (d?.message as { message?: string })?.message ?? fallbackMessage;
    throw new Error(msg);
  }
}

// Merchants
export async function listMerchants(params?: {
  limit?: number;
  offset?: number;
}): Promise<{ data: Merchant[] }> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  const url = `/api/erpnext/merchant${sp.toString() ? `?${sp.toString()}` : ""}`;
  const res = await fetchWithAuth(url);
  await throwOnNotOk(res, "Failed to load merchants");
  return res.json();
}

export async function getMerchant(id: string): Promise<Merchant> {
  const res = await fetchWithAuth(`/api/erpnext/merchant/${encodeURIComponent(id)}`);
  await throwOnNotOk(res, "Failed to load merchant");
  const data = await res.json();
  return data.data ?? data;
}

export async function createMerchant(data: Partial<Merchant>): Promise<Merchant> {
  const res = await fetchWithAuth("/api/erpnext/merchant", {
    method: "POST",
    body: JSON.stringify(data),
  });
  await throwOnNotOk(res, "Failed to create merchant");
  const result = await res.json();
  return result.data ?? result;
}

export async function updateMerchant(
  id: string,
  data: Partial<Merchant>
): Promise<Merchant> {
  const res = await fetchWithAuth(
    `/api/erpnext/merchant/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(data) }
  );
  await throwOnNotOk(res, "Failed to update merchant");
  const result = await res.json();
  return result.data ?? result;
}

export async function deleteMerchant(id: string): Promise<void> {
  const res = await fetchWithAuth(
    `/api/erpnext/merchant/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
  await throwOnNotOk(res, "Failed to delete merchant");
}

// Merchant Gateway Accounts
export async function listMerchantGatewayAccounts(params?: {
  limit?: number;
  offset?: number;
  merchant?: string;
}): Promise<{ data: MerchantGatewayAccount[] }> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  if (params?.merchant) sp.set("merchant", params.merchant);
  const url = `/api/erpnext/merchant-gateway-account${sp.toString() ? `?${sp.toString()}` : ""}`;
  const res = await fetchWithAuth(url);
  await throwOnNotOk(res, "Failed to load gateway accounts");
  return res.json();
}

export async function getMerchantGatewayAccount(
  id: string
): Promise<MerchantGatewayAccount> {
  const res = await fetchWithAuth(
    `/api/erpnext/merchant-gateway-account/${encodeURIComponent(id)}`
  );
  await throwOnNotOk(res, "Failed to load gateway account");
  const data = await res.json();
  return data.data ?? data;
}

export async function createMerchantGatewayAccount(
  data: Partial<MerchantGatewayAccount>
): Promise<MerchantGatewayAccount> {
  const res = await fetchWithAuth("/api/erpnext/merchant-gateway-account", {
    method: "POST",
    body: JSON.stringify(data),
  });
  await throwOnNotOk(res, "Failed to create gateway account");
  const result = await res.json();
  return result.data ?? result;
}

export async function updateMerchantGatewayAccount(
  id: string,
  data: Partial<MerchantGatewayAccount>
): Promise<MerchantGatewayAccount> {
  const res = await fetchWithAuth(
    `/api/erpnext/merchant-gateway-account/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(data) }
  );
  await throwOnNotOk(res, "Failed to update gateway account");
  const result = await res.json();
  return result.data ?? result;
}

export async function deleteMerchantGatewayAccount(id: string): Promise<void> {
  const res = await fetchWithAuth(
    `/api/erpnext/merchant-gateway-account/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
  await throwOnNotOk(res, "Failed to delete gateway account");
}

// Payment Transaction Log (read-only)
export async function listPaymentTransactionLogs(params?: {
  limit?: number;
  offset?: number;
  payment_request?: string;
}): Promise<{ data: PaymentTransactionLog[] }> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  if (params?.payment_request) sp.set("payment_request", params.payment_request);
  const url = `/api/erpnext/payment-transaction-log${sp.toString() ? `?${sp.toString()}` : ""}`;
  const res = await fetchWithAuth(url);
  await throwOnNotOk(res, "Failed to load transaction logs");
  return res.json();
}
