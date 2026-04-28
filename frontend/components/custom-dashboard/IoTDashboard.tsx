"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LayoutItem } from "react-grid-layout";
import {
  AlertCircle,
  Eye,
  LayoutGrid,
  Loader2,
  Pencil,
  Plus,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import { useSubscriptionAccess } from "@/components/subscription/SubscriptionAccessProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { WidgetEditorDialog } from "@/components/custom-dashboard/WidgetEditorDialog";
import { WidgetRenderer } from "@/components/custom-dashboard/WidgetRenderer";
import {
  customDashboardQueryKey,
  getCustomDashboard,
  getWidgetDataBatch,
  saveCustomDashboard,
  widgetBatchQueryKey,
} from "@/lib/api/custom-dashboard/client";
import {
  buildLayoutJsonForSave,
  buildWidgetsJsonForSave,
  parseCustomDashboardPayload,
  type DashboardWidgetConfig,
  type WidgetBatchResultEntry,
} from "@/lib/api/custom-dashboard/types";

const DashboardGrid = dynamic(
  () =>
    import("@/components/custom-dashboard/DashboardGrid").then((m) => ({
      default: m.DashboardGrid,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted/40 h-[360px] w-full animate-pulse rounded-lg" />
    ),
  },
);

function mergeLayoutWithWidgets(
  layout: LayoutItem[],
  widgets: DashboardWidgetConfig[],
): LayoutItem[] {
  const ids = new Set(widgets.map((w) => w.id));
  const pruned = layout.filter((l) => ids.has(l.i));
  const seen = new Set(pruned.map((l) => l.i));
  const bottom = pruned.reduce((m, it) => Math.max(m, it.y + it.h), 0);
  let yCursor = bottom;
  for (const w of widgets) {
    if (!seen.has(w.id)) {
      pruned.push({
        i: w.id,
        x: 0,
        y: yCursor,
        w: 4,
        h: 3,
        minW: 2,
        minH: 2,
      });
      yCursor += 3;
      seen.add(w.id);
    }
  }
  return pruned;
}

export function IoTDashboard() {
  const queryClient = useQueryClient();
  const { isProductSuspended, isLoading: subscriptionAccessLoading } =
    useSubscriptionAccess();

  const dashboardQuery = useQuery({
    queryKey: customDashboardQueryKey(),
    queryFn: () => getCustomDashboard(),
    retry: 1,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>([]);
  const [recordName, setRecordName] = useState<string | null>(null);
  const [dashboardLabel, setDashboardLabel] = useState<string | null>(null);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"add" | "edit">("add");
  const [editingWidget, setEditingWidget] =
    useState<DashboardWidgetConfig | null>(null);

  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const layoutRef = useRef(layout);
  const widgetsRef = useRef(widgets);
  layoutRef.current = layout;
  widgetsRef.current = widgets;

  useEffect(() => {
    if (!dashboardQuery.isSuccess || !dashboardQuery.data) return;
    const d = dashboardQuery.data;
    setRecordName(d.name);
    setDashboardLabel(d.dashboardName ?? d.name);
    setSaveAsDefault(d.isDefault);
    setLayout(mergeLayoutWithWidgets(d.layout, d.widgets));
    setWidgets(d.widgets);
  }, [dashboardQuery.isSuccess, dashboardQuery.data]);

  const batchQuery = useQuery({
    queryKey: widgetBatchQueryKey(widgets),
    queryFn: () => getWidgetDataBatch(widgets),
    enabled: widgets.length > 0 && !dashboardQuery.isLoading,
    retry: 1,
    staleTime: 30_000,
    refetchInterval: false,
  });

  const batchById = useMemo(() => {
    const m = new Map<string, WidgetBatchResultEntry>();
    for (const row of batchQuery.data ?? []) {
      if (row.widget_id) m.set(row.widget_id, row);
    }
    return m;
  }, [batchQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const synced = mergeLayoutWithWidgets(
        layoutRef.current,
        widgetsRef.current,
      );
      return saveCustomDashboard({
        name: recordName,
        dashboard_name: dashboardLabel,
        layout_json: buildLayoutJsonForSave(synced),
        widgets_json: buildWidgetsJsonForSave(widgetsRef.current),
        is_default: saveAsDefault ? 1 : 0,
      });
    },
    onSuccess: (data: unknown) => {
      const parsed = parseCustomDashboardPayload(data);
      if (parsed.name) setRecordName(parsed.name);
      if (parsed.dashboardName) setDashboardLabel(parsed.dashboardName);
      toast.success("Dashboard saved");
      void queryClient.invalidateQueries({
        queryKey: customDashboardQueryKey(),
      });
    },
    onError: (e: Error) => {
      toast.error(e.message || "Save failed");
    },
  });

  const persistSoon = useCallback(() => {
    if (!editMode) return;
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      saveDebounceRef.current = null;
      saveMutation.mutate();
    }, 500);
  }, [editMode, saveMutation]);

  const handleLayoutFromGrid = useCallback((next: LayoutItem[]) => {
    setLayout(next);
  }, []);

  const handleOpenAdd = () => {
    setEditorMode("add");
    setEditingWidget(null);
    setEditorOpen(true);
  };

  const handleConfigure = (id: string) => {
    const w = widgets.find((x) => x.id === id);
    if (!w) return;
    setEditorMode("edit");
    setEditingWidget(w);
    setEditorOpen(true);
  };

  const handleSaveWidget = (config: DashboardWidgetConfig) => {
    if (editorMode === "add") {
      setWidgets((prev) => {
        const next = [...prev, config];
        setLayout((lp) => mergeLayoutWithWidgets(lp, next));
        return next;
      });
    } else {
      setWidgets((prev) => prev.map((w) => (w.id === config.id ? config : w)));
    }
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    setLayout((prev) => prev.filter((l) => l.i !== id));
  };

  const isLoading = dashboardQuery.isLoading;
  const loadError =
    dashboardQuery.isError && (dashboardQuery.error as Error)?.message;

  return (
    <div className="flex flex-1 flex-col gap-4">
      {!subscriptionAccessLoading && isProductSuspended && (
        <Alert variant="destructive" className="border-destructive/80">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Account on hold — dashboard data may be unavailable until
              subscription is active.
            </span>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/pages/subscription">Go to Subscription</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div></div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={editMode ? "secondary" : "outline"}
            size="sm"
            onClick={() => setEditMode((v) => !v)}
          >
            {editMode ? (
              <>
                <Eye className="mr-1.5 h-4 w-4" />
                View
              </>
            ) : (
              <>
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </>
            )}
          </Button>
          {editMode ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenAdd}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add widget
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-4 w-4" />
                )}
                Save
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {editMode ? (
        <div className="bg-muted/30 flex flex-wrap items-center gap-4 rounded-lg border px-3 py-2">
          <div className="flex items-center gap-2">
            <input
              id="default-dash"
              type="checkbox"
              className="border-input size-4 rounded border"
              checked={saveAsDefault}
              onChange={(e) => setSaveAsDefault(e.target.checked)}
            />
            <Label htmlFor="default-dash" className="text-sm">
              Set as my default dashboard
            </Label>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 py-16">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          <span className="text-muted-foreground text-sm">
            Loading dashboard…
          </span>
        </div>
      ) : loadError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>{loadError}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void dashboardQuery.refetch()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : widgets.length === 0 ? (
        <div className="border-muted-foreground/25 flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-20">
          <LayoutGrid className="text-muted-foreground h-10 w-10" />
          <p className="text-muted-foreground max-w-md text-center text-sm">
            No widgets yet. Use Edit, add a KPI, chart, table, or custom widget,
            then Save so it comes back after refresh.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={() => setEditMode(true)}>
              Start editing
            </Button>
            {editMode ? (
              <Button type="button" variant="secondary" onClick={handleOpenAdd}>
                Add widget
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <DashboardGrid
          layout={layout}
          editMode={editMode}
          onLayoutChange={handleLayoutFromGrid}
          onDragOrResizeStop={persistSoon}
          className="min-h-[420px]"
        >
          {layout.map((item) => {
            const w = widgets.find((x) => x.id === item.i);
            if (!w) {
              return (
                <div
                  key={item.i}
                  className="bg-muted/40 flex h-full items-center justify-center rounded-lg border text-xs"
                >
                  Missing config ({item.i})
                </div>
              );
            }
            return (
              <div
                key={item.i}
                className="h-full min-h-0 overflow-hidden rounded-lg"
              >
                <WidgetRenderer
                  config={w}
                  batchEntry={batchById.get(w.id)}
                  loading={batchQuery.isLoading}
                  editMode={editMode}
                  onConfigure={handleConfigure}
                />
              </div>
            );
          })}
        </DashboardGrid>
      )}

      {batchQuery.isError && widgets.length > 0 ? (
        <p className="text-destructive text-sm">
          {(batchQuery.error as Error)?.message ?? "Failed to load widget data"}
        </p>
      ) : null}

      <WidgetEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        mode={editorMode}
        initial={editingWidget}
        onSave={handleSaveWidget}
        onRemove={editorMode === "edit" ? handleRemoveWidget : undefined}
      />
    </div>
  );
}
