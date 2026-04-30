"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listERPNextDevices } from "@/lib/api/device/device";
import { listERPNextGateways } from "@/lib/api/gateway/gateway";
import type {
  ChartSubtype,
  CustomWidgetSource,
  DashboardWidgetType,
  DashboardWidgetConfig,
} from "@/lib/api/custom-dashboard/types";
import { cn } from "@/lib/utils";

export interface WidgetEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initial?: DashboardWidgetConfig | null;
  onSave: (config: DashboardWidgetConfig) => void;
  onRemove?: (id: string) => void;
}

const WIDGET_TYPES: DashboardWidgetType[] = [
  "kpi",
  "chart",
  "table",
  "custom",
];

const CHART_TYPES: ChartSubtype[] = ["bar", "line", "pie"];

const CUSTOM_SOURCES: CustomWidgetSource[] = [
  "chirpstack",
  "redis_events",
  "mqtt_stub",
];

type KpiAggregate = "count" | "sum" | "avg" | "min" | "max";
const KPI_DOCTYPES = ["Device", "Application", "Gateway", "Asset"] as const;
const KPI_AGGREGATES: KpiAggregate[] = ["count", "sum", "avg", "min", "max"];

type RedisStreamType = "gateway" | "device";

type DeviceOption = {
  id: string;
  label: string;
  dev_eui: string;
};

type GatewayOption = {
  id: string;
  label: string;
  gateway_id: string;
};

function defaultKpiFilters(): Record<string, unknown> {
  return { doctype: "Device", aggregate: "count" };
}

function defaultChirpstackFilters(): Record<string, unknown> {
  return { dev_eui: "" };
}

function defaultRedisEventsFilters(): Record<string, unknown> {
  return { stream_type: "gateway", gateway_id: "" };
}

function defaultMqttStubFilters(): Record<string, unknown> {
  return {};
}

function isLikelyEmptyObjectJson(text: string): boolean {
  const t = text.trim();
  return t === "" || t === "{}" || t === "{ }";
}

function hasDeviceIdentifier(filters: Record<string, unknown>): boolean {
  const devEui = filters.dev_eui ?? filters.device_eui;
  if (typeof devEui === "string" && devEui.trim()) return true;
  const deviceDoc = filters.device ?? filters.device_doc;
  if (typeof deviceDoc === "string" && deviceDoc.trim()) return true;
  const doctype = filters.doctype;
  const name = filters.name;
  if (doctype === "Device" && typeof name === "string" && name.trim()) return true;
  const deviceName = filters.device_name;
  if (typeof deviceName === "string" && deviceName.trim()) return true;
  return false;
}

function hasGatewayIdentifier(filters: Record<string, unknown>): boolean {
  const gw = filters.gateway_id ?? filters.gateway_eui;
  return typeof gw === "string" && gw.trim().length > 0;
}

function getCustomTemplate(source: CustomWidgetSource): Record<string, unknown> {
  const s = String(source || "chirpstack").toLowerCase();
  if (s === "redis_events") return defaultRedisEventsFilters();
  if (s === "mqtt_stub") return defaultMqttStubFilters();
  return defaultChirpstackFilters();
}

function tryParseJsonObject(text: string): Record<string, unknown> | null {
  const t = text.trim();
  if (!t) return {};
  try {
    const v = JSON.parse(t) as unknown;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return v as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export function WidgetEditorDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSave,
  onRemove,
}: WidgetEditorDialogProps) {
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [widgetType, setWidgetType] = useState<DashboardWidgetType>("kpi");
  const [filtersJson, setFiltersJson] = useState("{}");
  const [chartSubtype, setChartSubtype] = useState<ChartSubtype>("bar");
  const [customSource, setCustomSource] =
    useState<CustomWidgetSource>("chirpstack");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [customDevEui, setCustomDevEui] = useState("");
  const [redisStreamType, setRedisStreamType] =
    useState<RedisStreamType>("gateway");
  const [redisGatewayId, setRedisGatewayId] = useState("");
  const [deviceOptions, setDeviceOptions] = useState<DeviceOption[]>([]);
  const [gatewayOptions, setGatewayOptions] = useState<GatewayOption[]>([]);
  const [deviceOptionsLoading, setDeviceOptionsLoading] = useState(false);
  const [gatewayOptionsLoading, setGatewayOptionsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setId(initial.id);
      setTitle(initial.title ?? "");
      setWidgetType(initial.widget_type);
      setFiltersJson(JSON.stringify(initial.filters ?? {}, null, 2));
      setChartSubtype(initial.chart_subtype ?? "bar");
      setCustomSource(initial.custom_source ?? "chirpstack");
    } else {
      setId(`w_${crypto.randomUUID().slice(0, 8)}`);
      setTitle("");
      setWidgetType("kpi");
      setFiltersJson(JSON.stringify(defaultKpiFilters(), null, 2));
      setChartSubtype("bar");
      setCustomSource("chirpstack");
    }
    const parsed = tryParseJsonObject(
      mode === "edit" && initial
        ? JSON.stringify(initial.filters ?? {})
        : JSON.stringify(defaultKpiFilters()),
    );
    setCustomDevEui(
      typeof parsed?.dev_eui === "string" ? parsed.dev_eui : "",
    );
    setRedisStreamType(
      parsed?.stream_type === "device" ? "device" : "gateway",
    );
    setRedisGatewayId(
      typeof parsed?.gateway_id === "string" ? parsed.gateway_id : "",
    );
    setJsonError(null);
  }, [open, mode, initial]);

  useEffect(() => {
    if (!open) return;
    if (widgetType !== "custom") return;

    const source = String(customSource || "chirpstack").toLowerCase();
    if (source === "chirpstack" || source === "redis_events") {
      setDeviceOptionsLoading(true);
      void listERPNextDevices({ limit: 200, offset: 0 })
        .then((res) => {
          const rows: any[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
          const mapped = rows
            .map((d) => {
              const dev_eui = String(d?.dev_eui ?? "").trim();
              if (!dev_eui) return null;
              const labelBase =
                String(d?.device_name ?? d?.name ?? dev_eui).trim() || dev_eui;
              return {
                id: String(d?.name ?? dev_eui),
                label: `${labelBase} (${dev_eui})`,
                dev_eui,
              } satisfies DeviceOption;
            })
            .filter((x): x is DeviceOption => x != null);
          setDeviceOptions(mapped);
        })
        .catch(() => {
          setDeviceOptions([]);
        })
        .finally(() => setDeviceOptionsLoading(false));
    }

    if (source === "redis_events") {
      setGatewayOptionsLoading(true);
      void listERPNextGateways({ limit: 200, offset: 0 })
        .then((res) => {
          const rows: any[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
          const mapped = rows
            .map((g) => {
              const name = String(g?.name ?? "").trim();
              if (!name) return null;
              const labelBase =
                String(g?.gateway_name ?? g?.name ?? "").trim() || name;
              const mac = String(g?.gateway_id_mac ?? "").trim();
              const chirpstackId = String(g?.chirpstack_id ?? "").trim();
              const extra = mac ? ` — ${mac}` : "";
              const gatewayIdentifier = mac || chirpstackId || name;
              return {
                id: name,
                label: `${labelBase}${extra}`,
                gateway_id: gatewayIdentifier,
              } satisfies GatewayOption;
            })
            .filter((x): x is GatewayOption => x != null);
          setGatewayOptions(mapped);
        })
        .catch(() => setGatewayOptions([]))
        .finally(() => setGatewayOptionsLoading(false));
    }
  }, [open, widgetType, customSource]);

  // Auto-seed KPI filters so backend can resolve the KPI doctype.
  useEffect(() => {
    if (!open) return;
    if (widgetType !== "kpi") return;
    if (!isLikelyEmptyObjectJson(filtersJson)) return;
    setFiltersJson(JSON.stringify(defaultKpiFilters(), null, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, widgetType]);

  // Auto-seed Custom widget filters based on selected custom source.
  useEffect(() => {
    if (!open) return;
    if (widgetType !== "custom") return;
    if (!isLikelyEmptyObjectJson(filtersJson)) return;
    const template = getCustomTemplate(customSource);
    setCustomDevEui(
      typeof template.dev_eui === "string" ? String(template.dev_eui) : "",
    );
    setRedisStreamType(
      template.stream_type === "device" ? "device" : "gateway",
    );
    setRedisGatewayId(
      typeof template.gateway_id === "string" ? String(template.gateway_id) : "",
    );
    setFiltersJson(JSON.stringify(template, null, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, widgetType, customSource]);

  // Keep the JSON textarea in sync when using quick inputs.
  useEffect(() => {
    if (!open) return;
    if (widgetType !== "custom") return;
    const f = tryParseJsonObject(filtersJson) ?? {};
    const source = String(customSource || "chirpstack").toLowerCase();
    if (source === "chirpstack") {
      const next = { ...f, dev_eui: customDevEui };
      setFiltersJson(JSON.stringify(next, null, 2));
      return;
    }
    if (source === "redis_events") {
      const next: Record<string, unknown> = { ...f, stream_type: redisStreamType };
      if (redisStreamType === "gateway") {
        next.gateway_id = redisGatewayId;
      } else {
        // prefer dev_eui for device stream; user can still edit JSON for alternatives
        next.dev_eui = customDevEui;
      }
      setFiltersJson(JSON.stringify(next, null, 2));
    }
    // mqtt_stub doesn't need syncing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customDevEui, redisStreamType, redisGatewayId, customSource, widgetType, open]);

  function parseFilters(): Record<string, unknown> | undefined {
    const t = filtersJson.trim();
    if (!t) return {};
    try {
      const v = JSON.parse(t) as unknown;
      if (v && typeof v === "object" && !Array.isArray(v)) {
        setJsonError(null);
        return v as Record<string, unknown>;
      }
      setJsonError("Filters must be a JSON object");
      return undefined;
    } catch {
      setJsonError("Invalid JSON");
      return undefined;
    }
  }

  function handleSave() {
    const filters = parseFilters();
    if (filters === undefined && filtersJson.trim()) return;

    if (widgetType === "kpi") {
      const doctype = (filters ?? {}).doctype;
      const aggregate = (filters ?? {}).aggregate;
      const doctypeOk =
        typeof doctype === "string" &&
        (KPI_DOCTYPES as readonly string[]).includes(doctype);
      const aggregateOk =
        typeof aggregate === "string" &&
        (KPI_AGGREGATES as readonly string[]).includes(aggregate);

      if (!doctypeOk || !aggregateOk) {
        setJsonError(
          `KPI requires filters.doctype (${KPI_DOCTYPES.join(
            ", ",
          )}) and filters.aggregate (${KPI_AGGREGATES.join(", ")}).`,
        );
        return;
      }
      setJsonError(null);
    }

    if (widgetType === "custom") {
      const f = filters ?? {};
      const source = String(
        (f.source ?? f.custom_source ?? f.customSource ?? customSource) ||
          "chirpstack",
      ).toLowerCase();

      if (source === "chirpstack") {
        if (!hasDeviceIdentifier(f)) {
          setJsonError(
            "ChirpStack custom widget requires a device identifier: filters.dev_eui (recommended) or filters.device / filters.device_name / (doctype:\"Device\" + name:\"...\").",
          );
          return;
        }
      } else if (source === "redis_events") {
        const st = String((f.stream_type ?? "") || "").toLowerCase();
        const streamType: RedisStreamType =
          st === "device" ? "device" : "gateway";
        if (streamType === "gateway") {
          if (!hasGatewayIdentifier(f)) {
            setJsonError(
              "redis_events gateway stream requires filters.gateway_id (or filters.gateway_eui). Set filters.stream_type=\"device\" to use a device stream instead.",
            );
            return;
          }
        } else {
          if (!hasDeviceIdentifier(f)) {
            setJsonError(
              "redis_events device stream requires filters.dev_eui (or filters.device / filters.device_name).",
            );
            return;
          }
        }
      } else if (source === "mqtt_stub") {
        // No required inputs; backend returns configured=false if not set up.
      } else {
        setJsonError(
          'Unsupported custom source. Use "chirpstack", "redis_events", or "mqtt_stub".',
        );
        return;
      }
      setJsonError(null);
    }

    onSave({
      id,
      widget_type: widgetType,
      title: title.trim() || undefined,
      filters: filters ?? {},
      chart_subtype: widgetType === "chart" ? chartSubtype : undefined,
      custom_source: widgetType === "custom" ? customSource : undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add widget" : "Edit widget"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          {mode === "edit" ? (
            <div className="space-y-2">
              <Label htmlFor="widget-id">Widget id</Label>
              <Input id="widget-id" value={id} disabled readOnly />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="widget-title">Title</Label>
            <Input
              id="widget-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Optional display title"
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={widgetType}
              onValueChange={(v) => setWidgetType(v as DashboardWidgetType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WIDGET_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {widgetType === "chart" ? (
            <div className="space-y-2">
              <Label>Chart type</Label>
              <Select
                value={chartSubtype}
                onValueChange={(v) => setChartSubtype(v as ChartSubtype)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHART_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {widgetType === "custom" ? (
            <div className="space-y-2">
              <Label>Custom source</Label>
              <Select
                value={customSource}
                onValueChange={(v) => setCustomSource(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOM_SOURCES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {widgetType === "custom" && String(customSource).toLowerCase() === "chirpstack" ? (
            <div className="space-y-2">
              <Label>Device DevEUI (required)</Label>
              <Select value={customDevEui} onValueChange={setCustomDevEui}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      deviceOptionsLoading
                        ? "Loading devices…"
                        : deviceOptions.length
                          ? "Select a device"
                          : "No devices with DevEUI found"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {deviceOptions.map((d) => (
                    <SelectItem key={d.id} value={d.dev_eui}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                This maps to <span className="font-mono">filters.dev_eui</span>.
              </p>
            </div>
          ) : null}
          {widgetType === "custom" && String(customSource).toLowerCase() === "redis_events" ? (
            <div className="space-y-3 rounded-md border p-3">
              <div className="space-y-2">
                <Label>Stream type</Label>
                <Select
                  value={redisStreamType}
                  onValueChange={(v) =>
                    setRedisStreamType(v === "device" ? "device" : "gateway")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gateway">gateway</SelectItem>
                    <SelectItem value="device">device</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {redisStreamType === "gateway" ? (
                <div className="space-y-2">
                  <Label>Gateway (required)</Label>
                  <Select value={redisGatewayId} onValueChange={setRedisGatewayId}>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          gatewayOptionsLoading
                            ? "Loading gateways…"
                            : gatewayOptions.length
                              ? "Select a gateway"
                              : "No gateways found"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {gatewayOptions.map((g) => (
                        <SelectItem key={g.id} value={g.gateway_id}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    This maps to <span className="font-mono">filters.gateway_id</span>.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Device DevEUI (required)</Label>
                  <Select value={customDevEui} onValueChange={setCustomDevEui}>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          deviceOptionsLoading
                            ? "Loading devices…"
                            : deviceOptions.length
                              ? "Select a device"
                              : "No devices with DevEUI found"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {deviceOptions.map((d) => (
                        <SelectItem key={d.id} value={d.dev_eui}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    This maps to <span className="font-mono">filters.dev_eui</span>.
                  </p>
                </div>
              )}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="widget-filters">Filters (JSON object)</Label>
            <textarea
              id="widget-filters"
              value={filtersJson}
              onChange={(e) => setFiltersJson(e.target.value)}
              rows={6}
              className={cn(
                "border-input bg-transparent w-full rounded-md border px-3 py-2 font-mono text-xs shadow-xs outline-none",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
              )}
            />
            {jsonError ? (
              <p className="text-destructive text-xs">{jsonError}</p>
            ) : null}
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {mode === "edit" && onRemove ? (
            <Button
              type="button"
              variant="destructive"
              className="sm:mr-auto"
              onClick={() => {
                onRemove(id);
                onOpenChange(false);
              }}
            >
              Remove
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
