"use client";

import { Pencil, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  DashboardWidgetConfig,
  WidgetBatchResultEntry,
} from "@/lib/api/custom-dashboard/types";
import { KPIWidget } from "./widgets/KPIWidget";
import { ChartWidget } from "./widgets/ChartWidget";
import { TableWidget } from "./widgets/TableWidget";
import { CustomWidget } from "./widgets/CustomWidget";
import { cn } from "@/lib/utils";

export function WidgetRenderer({
  config,
  batchEntry,
  loading,
  editMode,
  onConfigure,
}: {
  config: DashboardWidgetConfig;
  batchEntry?: WidgetBatchResultEntry;
  loading: boolean;
  editMode: boolean;
  onConfigure: (id: string) => void;
}) {
  const title = config.title || config.widget_type.toUpperCase();
  const err = batchEntry && !batchEntry.ok ? batchEntry.error : undefined;
  const data = batchEntry?.data;

  return (
    <Card className="border-border/80 bg-card flex h-full flex-col overflow-hidden shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b py-2 pr-2 pl-3">
        <CardTitle className="truncate text-sm font-medium">{title}</CardTitle>
        {editMode ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onConfigure(config.id)}
            aria-label="Edit widget"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        {loading ? (
          <div className="flex flex-1 flex-col gap-2 p-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full flex-1" />
          </div>
        ) : err ? (
          <div className="text-destructive flex flex-1 items-start gap-2 p-3 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{err}</span>
          </div>
        ) : (
          <WidgetBody config={config} data={data} />
        )}
      </CardContent>
    </Card>
  );
}

function WidgetBody({
  config,
  data,
}: {
  config: DashboardWidgetConfig;
  data: unknown;
}) {
  const title = config.title;
  switch (config.widget_type) {
    case "kpi":
      return <KPIWidget title={title} data={data} />;
    case "chart":
      return (
        <ChartWidget
          title={title}
          data={data}
          chartSubtype={config.chart_subtype}
        />
      );
    case "table":
      return <TableWidget title={title} data={data} />;
    case "custom":
      return (
        <CustomWidget
          title={title}
          source={config.custom_source}
          data={data}
        />
      );
    default:
      return (
        <p className={cn("text-muted-foreground p-3 text-sm")}>
          Unknown widget type
        </p>
      );
  }
}
