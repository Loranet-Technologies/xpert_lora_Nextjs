import { getERPNextToken } from "../utils/token";

export interface CreatePaymentIntentResponse {
  client_secret: string;
  publishable_key: string;
  payment_request: string;
  amount: number;
  currency: string;
}

export interface PaymentRequestStatus {
  name: string;
  status: "Draft" | "Requested" | "Paid" | "Cancelled";
  grand_total?: number;
  currency?: string;
  outstanding_amount?: number;
}

/**
 * Create a Stripe PaymentIntent for an ERPNext Payment Request.
 * Works for guests (no login). Use the returned client_secret and publishable_key with Stripe.js.
 * When the customer pays, Stripe calls the webhook and ERPNext marks the Payment Request as Paid.
 */
export async function createPaymentIntent(
  paymentRequestName: string,
): Promise<CreatePaymentIntentResponse> {
  const token = await getERPNextToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("/api/erpnext/payment/create-intent", {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ payment_request_name: paymentRequestName }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to create payment intent",
    }));
    const rawMessage =
      typeof errorData.message === "string"
        ? errorData.message
        : errorData.message?.message || "Failed to create payment intent";
    const { getPaymentErrorMessage } =
      await import("../utils/parseErpNextError");
    throw new Error(getPaymentErrorMessage(rawMessage));
  }

  const data = await response.json();

  if (!data.client_secret || !data.publishable_key) {
    throw new Error("Invalid response from payment server");
  }

  return data as CreatePaymentIntentResponse;
}

/**
 * Get Payment Request status from ERPNext.
 * After Stripe payment, the webhook marks the request as Paid; polling this confirms the invoice was updated.
 * Optional auth: if no token (guest), request is sent without Authorization (ERPNext may return 401 for Payment Request read).
 */
export async function getPaymentRequestStatus(
  paymentRequestName: string,
): Promise<PaymentRequestStatus> {
  const token = await getERPNextToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    `/api/erpnext/payment/request/${encodeURIComponent(paymentRequestName)}`,
    {
      method: "GET",
      headers,
      credentials: "include",
    },
  );

  if (!response.ok) {
    const err = await response
      .json()
      .catch(() => ({ message: "Failed to load status" }));
    throw new Error(err.message || "Failed to load payment status");
  }

  const data = await response.json();
  return data as PaymentRequestStatus;
}

/** Pay-first flow: create PaymentIntent for org + plan (no subscription yet). Webhook creates subscription on success. */
export interface CreatePaymentIntentForPlanResponse {
  client_secret: string;
  publishable_key: string;
  payment_request: string;
  amount: number;
  currency: string;
  sales_invoice?: string;
}

export async function createPaymentIntentForPlan(
  organization: string,
  plan: string,
  amount?: number,
): Promise<CreatePaymentIntentForPlanResponse> {
  const token = await getERPNextToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const body: { organization: string; plan: string; amount?: number } = {
    organization,
    plan,
  };
  if (typeof amount === "number" && amount > 0) {
    body.amount = amount;
  }

  const response = await fetch(
    "/api/erpnext/subscription/create-payment-intent-plan",
    {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to create payment",
    }));
    const rawMessage =
      typeof errorData.message === "string"
        ? errorData.message
        : errorData.message?.message || "Failed to create payment";
    const { getPaymentErrorMessage } =
      await import("../utils/parseErpNextError");
    throw new Error(getPaymentErrorMessage(rawMessage));
  }

  const data = await response.json();
  if (!data.client_secret || !data.publishable_key || !data.payment_request) {
    throw new Error("Invalid response from payment server");
  }
  return data as CreatePaymentIntentForPlanResponse;
}

/** Pay-first: get status for a payment request (status, subscription_name, can_pay_again, can_cancel). */
export interface PaymentStatusResponse {
  status: string;
  subscription_name?: string | null;
  can_pay_again: boolean;
  can_cancel: boolean;
}

export async function getPaymentStatus(
  paymentRequestName: string,
): Promise<PaymentStatusResponse> {
  const token = await getERPNextToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    `/api/erpnext/payment/status?payment_request_name=${encodeURIComponent(paymentRequestName)}`,
    {
      method: "GET",
      headers,
      credentials: "include",
    },
  );

  if (!response.ok) {
    const err = await response
      .json()
      .catch(() => ({ message: "Failed to load payment status" }));
    throw new Error(err.message || "Failed to load payment status");
  }

  const data = await response.json();
  return data as PaymentStatusResponse;
}

export interface RazorpayCheckoutResponse {
  checkout_url: string;
}

export async function createRazorpayCheckoutForPlan(
  organization: string,
  plan: string,
  amount?: number,
): Promise<RazorpayCheckoutResponse> {
  const token = await getERPNextToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const body: { organization: string; plan: string; amount?: number } = {
    organization,
    plan,
  };
  if (typeof amount === "number" && amount > 0) {
    body.amount = amount;
  }

  const response = await fetch(
    "/api/erpnext/payment/razorpay-checkout",
    {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to create Razorpay checkout",
    }));
    const rawMessage =
      typeof errorData.message === "string"
        ? errorData.message
        : errorData.message?.message ||
          "Failed to create Razorpay checkout";
    const { getPaymentErrorMessage } =
      await import("../utils/parseErpNextError");
    throw new Error(getPaymentErrorMessage(rawMessage));
  }

  const data = await response.json();
  return data as RazorpayCheckoutResponse;
}

export interface CreateRazorpayOrderForPlanResponse {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  integration_request: string;
  payment_request: string;
}

export async function createRazorpayOrderForPlan(
  organization: string,
  plan: string,
  amount?: number,
): Promise<CreateRazorpayOrderForPlanResponse> {
  const token = await getERPNextToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const body: { organization: string; plan: string; amount?: number } = {
    organization,
    plan,
  };
  if (typeof amount === "number" && amount > 0) {
    body.amount = amount;
  }

  const response = await fetch("/api/erpnext/payment/razorpay-order", {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to create Razorpay order",
    }));
    const rawMessage =
      typeof errorData.message === "string"
        ? errorData.message
        : errorData.message?.message || "Failed to create Razorpay order";
    const { getPaymentErrorMessage } =
      await import("../utils/parseErpNextError");
    throw new Error(getPaymentErrorMessage(rawMessage));
  }

  const data = await response.json();
  return data as CreateRazorpayOrderForPlanResponse;
}

export interface CompleteRazorpayPaymentForPlanParams {
  integration_request: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export async function completeRazorpayPaymentForPlan(
  params: CompleteRazorpayPaymentForPlanParams,
): Promise<void> {
  const token = await getERPNextToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("/api/erpnext/payment/razorpay-complete", {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to complete Razorpay payment",
    }));
    const rawMessage =
      typeof errorData.message === "string"
        ? errorData.message
        : errorData.message?.message ||
          "Failed to complete Razorpay payment";
    const { getPaymentErrorMessage } =
      await import("../utils/parseErpNextError");
    throw new Error(getPaymentErrorMessage(rawMessage));
  }
}
