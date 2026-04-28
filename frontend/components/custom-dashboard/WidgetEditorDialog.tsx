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
      setFiltersJson("{}");
      setChartSubtype("bar");
      setCustomSource("chirpstack");
    }
    setJsonError(null);
  }, [open, mode, initial]);

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
