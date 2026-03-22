import { getERPNextToken } from "../utils/token";

export type PaymentBillingLogStatus =
  | "Initiated"
  | "Processing"
  | "Completed"
  | "Failed"
  | "Cancelled";

export interface PaymentBillingLogRow {
  name: string;
  creation?: string;
  timestamp?: string;
  payment_request?: string | null;
  event_type?: string | null;
  gateway_event?: string | null;
  gateway_reference?: string | null;
  transaction_id?: string | null;
  status?: string | null;
  amount?: number | null;
  currency?: string | null;
  organization?: string | null;
  merchant?: string | null;
  payment_gateway?: string | null;
  is_processed?: number | boolean | null;
  error_message?: string | null;
  reference_doctype?: string | null;
  reference_name?: string | null;
  gateway_response?: string | null;
}

export const PAYMENT_BILLING_STATUSES: PaymentBillingLogStatus[] = [
  "Initiated",
  "Processing",
  "Completed",
  "Failed",
  "Cancelled",
];

export interface GetPaymentBillingLogsParams {
  status?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  start?: number;
  /** If true, each row may include gateway_response (JSON string). */
  include_payload?: boolean;
}

export async function getPaymentBillingLogs(
  params: GetPaymentBillingLogsParams = {},
): Promise<{ success: boolean; data: PaymentBillingLogRow[]; total: number }> {
  const {
    status,
    from_date,
    to_date,
    limit = 50,
    start = 0,
    include_payload = false,
  } = params;

  const token = await getERPNextToken();
  if (!token) {
    throw new Error(
      "ERPNext authentication token not found. Please login first.",
    );
  }

  const sp = new URLSearchParams();
  if (status) sp.set("status", status);
  if (from_date) sp.set("from_date", from_date);
  if (to_date) sp.set("to_date", to_date);
  sp.set("limit", String(limit));
  sp.set("start", String(start));
  if (include_payload) sp.set("include_payload", "1");

  const response = await fetch(
    `/api/erpnext/payment-billing-logs?${sp.toString()}`,
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
    const err = await response
      .json()
      .catch(() => ({ message: "Failed to load payment billing logs" }));
    throw new Error(
      typeof err.message === "string"
        ? err.message
        : "Failed to load payment billing logs",
    );
  }

  const json = await response.json();
  return {
    success: json.success !== false,
    data: json.data || [],
    total: typeof json.total === "number" ? json.total : json.data?.length ?? 0,
  };
}

/**
 * Load gateway JSON for a row on the current result page (same filters + pagination as the table).
 */
export async function getPaymentBillingLogPayload(
  row: Pick<PaymentBillingLogRow, "name">,
  listParams: {
    status?: string;
    from_date?: string;
    to_date?: string;
    limit: number;
    start: number;
  },
): Promise<string | null> {
  const res = await getPaymentBillingLogs({
    status: listParams.status,
    from_date: listParams.from_date,
    to_date: listParams.to_date,
    limit: listParams.limit,
    start: listParams.start,
    include_payload: true,
  });
  const hit = res.data.find((r) => r.name === row.name);
  return hit?.gateway_response ?? null;
}
