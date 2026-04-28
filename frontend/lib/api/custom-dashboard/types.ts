/**
 * Types for `xpert_lora_app.custom_dashboard` (XPERT-30).
 * Normalize backend field names here so UI stays decoupled from Frappe DocType JSON.
 */

import type { LayoutItem } from "react-grid-layout";

export type DashboardWidgetType = "kpi" | "chart" | "table" | "custom";

export type ChartSubtype = "bar" | "line" | "pie";

/** Optional custom widget source (backend custom handlers). */
export type CustomWidgetSource =
  | "chirpstack"
  | "redis_events"
  | "mqtt_stub"
  | string;

export interface DashboardWidgetConfig {
  /** Stable id; must match grid layout item `i`. */
  id: string;
  widget_type: DashboardWidgetType;
  title?: string;
  /** Parsed object for API; string form is accepted on load from backend. */
  filters?: Record<string, unknown>;
  chart_subtype?: ChartSubtype;
  /** For widget_type === "custom". */
  custom_source?: CustomWidgetSource;
}

export interface CustomDashboardRecord {
  name?: string | null;
  dashboard_name?: string | null;
  layout_json?: unknown;
  widgets_json?: unknown;
  is_default?: number | boolean;
}

export interface ParsedCustomDashboard {
  name: string | null;
  dashboardName: string | null;
  layout: LayoutItem[];
  widgets: DashboardWidgetConfig[];
  isDefault: boolean;
}

/** Single batch request item (align keys with backend when integrating). */
export interface WidgetBatchRequestItem {
  widget_id: string;
  widget_type: DashboardWidgetType;
  filters?: Record<string, unknown> | string;
}

export interface WidgetBatchResultEntry {
  widget_id: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}

const BATCH_SIZE = 15;

export function chunkWidgetBatch<T>(items: T[], size = BATCH_SIZE): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function widgetIdFromRecord(row: Record<string, unknown>): string {
  const v =
    row.id ??
    row.widget_id ??
    row.name ??
    row.i ??
    `w_${String(Math.random()).slice(2, 10)}`;
  return String(v);
}

export function normalizeWidgetRow(row: unknown): DashboardWidgetConfig | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const wt = o.widget_type ?? o.type;
  if (
    wt !== "kpi" &&
    wt !== "chart" &&
    wt !== "table" &&
    wt !== "custom"
  ) {
    return null;
  }
  let filters: Record<string, unknown> | undefined;
  const rawF = o.filters;
  if (typeof rawF === "string") {
    try {
      const p = JSON.parse(rawF) as unknown;
      if (p && typeof p === "object" && !Array.isArray(p)) {
        filters = p as Record<string, unknown>;
      }
    } catch {
      filters = undefined;
    }
  } else if (rawF && typeof rawF === "object" && !Array.isArray(rawF)) {
    filters = rawF as Record<string, unknown>;
  }

  const chartSubtype = o.chart_subtype ?? o.chartType;
  const customSource = o.custom_source ?? o.customSource;

  return {
    id: widgetIdFromRecord(o),
    widget_type: wt,
    title: o.title != null ? String(o.title) : undefined,
    filters,
    chart_subtype:
      chartSubtype === "bar" ||
      chartSubtype === "line" ||
      chartSubtype === "pie"
        ? chartSubtype
        : undefined,
    custom_source:
      customSource != null ? String(customSource) : undefined,
  };
}

/**
 * Frappe JSON / Dynamic Link fields often arrive as JSON-encoded strings.
 * If parsing fails, returns the original value.
 */
export function coerceJsonField(raw: unknown): unknown {
  if (raw == null || raw === "") return raw;
  if (typeof raw !== "string") return raw;
  const t = raw.trim();
  if (!t) return raw;
  try {
    return JSON.parse(t) as unknown;
  } catch {
    return raw;
  }
}

export function parseLayoutJson(raw: unknown): LayoutItem[] {
  raw = coerceJsonField(raw);
  if (raw == null || raw === "" || typeof raw === "string") return [];
  if (Array.isArray(raw)) {
    return raw.filter(isLayoutItemLike).map(coerceLayoutItem);
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const lg = coerceJsonField(o.lg);
    if (Array.isArray(lg))
      return lg.filter(isLayoutItemLike).map(coerceLayoutItem);
    const layoutBranch = coerceJsonField(o.layout);
    if (Array.isArray(layoutBranch))
      return layoutBranch.filter(isLayoutItemLike).map(coerceLayoutItem);
    for (const v of Object.values(o)) {
      const vv = coerceJsonField(v);
      if (Array.isArray(vv) && vv.length && isLayoutItemLike(vv[0])) {
        return vv.filter(isLayoutItemLike).map(coerceLayoutItem);
      }
    }
  }
  return [];
}

function isLayoutItemLike(x: unknown): boolean {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.i === "string";
}

function coerceLayoutItem(x: unknown): LayoutItem {
  const o = x as Record<string, unknown>;
  return {
    i: String(o.i),
    x: Number(o.x) || 0,
    y: Number(o.y) || 0,
    w: Math.max(1, Number(o.w) || 2),
    h: Math.max(1, Number(o.h) || 2),
    minW: o.minW != null ? Number(o.minW) : undefined,
    minH: o.minH != null ? Number(o.minH) : undefined,
    maxW: o.maxW != null ? Number(o.maxW) : undefined,
    maxH: o.maxH != null ? Number(o.maxH) : undefined,
    static: Boolean(o.static),
  };
}

export function parseWidgetsJson(raw: unknown): DashboardWidgetConfig[] {
  raw = coerceJsonField(raw);
  if (raw == null || raw === "" || typeof raw === "string") return [];
  if (Array.isArray(raw)) {
    return raw
      .map(normalizeWidgetRow)
      .filter((w): w is DashboardWidgetConfig => w != null);
  }
  if (typeof raw === "object" && raw !== null) {
    const o = raw as Record<string, unknown>;
    const inner = coerceJsonField(o.widgets ?? o.items);
    if (Array.isArray(inner)) {
      return inner
        .map(normalizeWidgetRow)
        .filter((w): w is DashboardWidgetConfig => w != null);
    }
    const asMap = Object.entries(o).filter(
      ([k, v]) =>
        k !== "widgets" &&
        k !== "items" &&
        v &&
        typeof v === "object" &&
        !Array.isArray(v) &&
        "widget_type" in (v as object),
    );
    if (asMap.length > 0) {
      return asMap
        .map(([k, v]) => {
          const row = {
            ...(v as Record<string, unknown>),
            id: (v as Record<string, unknown>).id ?? k,
          };
          return normalizeWidgetRow(row);
        })
        .filter((w): w is DashboardWidgetConfig => w != null);
    }
  }
  return [];
}

export function parseCustomDashboardPayload(
  payload: unknown,
): ParsedCustomDashboard {
  const empty: ParsedCustomDashboard = {
    name: null,
    dashboardName: null,
    layout: [],
    widgets: [],
    isDefault: false,
  };
  if (payload == null) return empty;

  let root: unknown = coerceJsonField(payload);
  if (typeof root === "string") {
    try {
      root = JSON.parse(root) as unknown;
    } catch {
      return empty;
    }
  }
  if (!root || typeof root !== "object") return empty;

  let o = root as Record<string, unknown>;

  if (Array.isArray(o.docs) && o.docs[0] && typeof o.docs[0] === "object") {
    o = o.docs[0] as Record<string, unknown>;
  } else if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) {
    const d = o.data as Record<string, unknown>;
    if (
      d.name != null ||
      d.layout_json != null ||
      d.widgets_json != null ||
      d.layout != null ||
      d.widgets != null
    ) {
      o = d;
    }
  }

  const name = o.name != null ? String(o.name) : null;
  const dashboardName =
    o.dashboard_name != null
      ? String(o.dashboard_name)
      : o.dashboardName != null
        ? String(o.dashboardName)
        : null;
  const isDefault = Boolean(o.is_default === 1 || o.is_default === true);

  const layoutRaw =
    o.layout_json ?? o.layout ?? o.layoutJson ?? (o as { layoutJSON?: unknown }).layoutJSON;
  const widgetsRaw =
    o.widgets_json ??
    o.widgets ??
    o.widgetsJson ??
    (o as { widgetsJSON?: unknown }).widgetsJSON;

  return {
    name,
    dashboardName,
    layout: parseLayoutJson(layoutRaw),
    widgets: parseWidgetsJson(widgetsRaw),
    isDefault,
  };
}

/**
 * Backend requires `layout_json` to be a JSON object (dict), not a raw array.
 * Use a single breakpoint key compatible with `parseLayoutJson` / react-grid-layout.
 */
export function buildLayoutJsonForSave(
  layout: readonly LayoutItem[],
): unknown {
  const items = layout.map((item) => {
    const row: Record<string, unknown> = { ...item };
    delete row.moved;
    return row;
  });
  return { lg: items };
}

/**
 * Frappe `widgets_json` rejects a top-level JSON list; send an object wrapper.
 * `parseWidgetsJson` already reads `widgets` (or `items`) when the root is an object.
 */
export function buildWidgetsJsonForSave(
  widgets: DashboardWidgetConfig[],
): unknown {
  return {
    widgets: widgets.map((w) => ({
      id: w.id,
      widget_type: w.widget_type,
      title: w.title,
      filters: w.filters ?? {},
      chart_subtype: w.chart_subtype,
      custom_source: w.custom_source,
    })),
  };
}

function readBatchArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.results)) return o.results;
  if (Array.isArray(o.items)) return o.items;
  if (Array.isArray(o.data)) return o.data;
  if (Array.isArray(o.widgets)) return o.widgets;
  return [];
}

/**
 * Normalizes `get_widget_data_batch` payloads from Frappe.
 * Supports a top-level array or objects with `results` / `items` / `data` / `widgets`.
 * Tighten field mapping once you capture a real response from `xpert_lora_app.custom_dashboard`.
 */
export function normalizeWidgetBatchResponse(
  payload: unknown,
): WidgetBatchResultEntry[] {
  const rows = readBatchArray(payload);
  return rows.map((row): WidgetBatchResultEntry => {
    if (!row || typeof row !== "object") {
      return { widget_id: "", ok: false, error: "Invalid batch row" };
    }
    const o = row as Record<string, unknown>;
    const widget_id = String(
      o.widget_id ?? o.id ?? o.i ?? o.widgetId ?? "",
    );
    const error =
      o.error != null
        ? String(o.error)
        : o.err != null
          ? String(o.err)
          : o.exc_type != null
            ? String(o.exc_type)
            : o.success === false && o.message != null
              ? String(o.message)
              : undefined;
    const ok =
      o.success !== false &&
      o.ok !== false &&
      !error &&
      o.exc_type == null;
    const data = o.data ?? o.result ?? (ok ? o : undefined);
    return { widget_id, ok, data, error };
  });
}
