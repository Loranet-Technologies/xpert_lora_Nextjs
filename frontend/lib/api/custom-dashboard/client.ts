import { getERPNextToken } from "../utils/token";
import {
  chunkWidgetBatch,
  normalizeWidgetBatchResponse,
  parseCustomDashboardPayload,
  type ParsedCustomDashboard,
  type DashboardWidgetConfig,
  type WidgetBatchRequestItem,
  type WidgetBatchResultEntry,
} from "./types";

export const CUSTOM_DASHBOARD_QUERY_KEY = ["custom-dashboard"] as const;

export function customDashboardQueryKey(params?: {
  name?: string;
  dashboard_name?: string;
}) {
  return [...CUSTOM_DASHBOARD_QUERY_KEY, params ?? {}] as const;
}

export function widgetBatchQueryKey(widgets: DashboardWidgetConfig[]) {
  return [
    "custom-dashboard-widget-batch",
    widgets.map((w) => ({
      id: w.id,
      t: w.widget_type,
      f: w.filters,
      c: w.chart_subtype,
      s: w.custom_source,
    })),
  ] as const;
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getERPNextToken();
  if (!token) {
    throw new Error("ERPNext authentication token not found. Please login first.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getCustomDashboard(params?: {
  name?: string;
  dashboard_name?: string;
}): Promise<ParsedCustomDashboard> {
  const headers = await authHeaders();
  const search = new URLSearchParams();
  if (params?.name) search.set("name", params.name);
  if (params?.dashboard_name) search.set("dashboard_name", params.dashboard_name);

  const qs = search.toString();
  const response = await fetch(
    `/api/erpnext/custom-dashboard/get${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      headers,
      credentials: "include",
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err.message || err.error || "Failed to load custom dashboard",
    );
  }

  const data = (await response.json()) as unknown;
  return parseCustomDashboardPayload(data);
}

export async function saveCustomDashboard(payload: {
  name?: string | null;
  dashboard_name?: string | null;
  layout_json: unknown;
  widgets_json: unknown;
  is_default?: number | boolean;
}): Promise<unknown> {
  const headers = await authHeaders();
  const response = await fetch("/api/erpnext/custom-dashboard/save", {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({
      name: payload.name,
      dashboard_name: payload.dashboard_name,
      layout_json: payload.layout_json,
      widgets_json: payload.widgets_json,
      is_default: payload.is_default,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || err.error || "Failed to save dashboard");
  }
  return response.json();
}

function toBatchItem(w: DashboardWidgetConfig): WidgetBatchRequestItem {
  return {
    widget_id: w.id,
    widget_type: w.widget_type,
    filters: w.filters ?? {},
  };
}

/**
 * Calls `get_widget_data_batch` in chunks of 15 (backend limit).
 * Merges per-chunk results in order.
 */
export async function getWidgetDataBatch(
  widgets: DashboardWidgetConfig[],
): Promise<WidgetBatchResultEntry[]> {
  if (widgets.length === 0) return [];
  const headers = await authHeaders();
  const chunks = chunkWidgetBatch(widgets);
  const merged: WidgetBatchResultEntry[] = [];

  for (const chunk of chunks) {
    const items = chunk.map(toBatchItem);
    const response = await fetch(
      "/api/erpnext/custom-dashboard/widget-data-batch",
      {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ items }),
      },
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        err.message || err.error || "Failed to load widget data batch",
      );
    }
    const raw = await response.json();
    merged.push(...normalizeWidgetBatchResponse(raw));
  }
  return merged;
}

export type { ParsedCustomDashboard };
