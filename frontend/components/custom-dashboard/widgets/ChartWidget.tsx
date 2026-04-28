"use client";

import { useMemo } from "react";
import type { ChartData } from "chart.js";
import "chart.js/auto";
import { Bar, Line, Pie } from "react-chartjs-2";
import type { ChartSubtype } from "@/lib/api/custom-dashboard/types";
import { adaptDataToChartJs } from "./chartAdapter";
import { cn } from "@/lib/utils";

const optionsBarLine = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: true, position: "top" as const } },
};

const optionsPie = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: true, position: "right" as const } },
};

export function ChartWidget({
  title,
  data,
  chartSubtype,
  className,
}: {
  title?: string;
  chartSubtype?: ChartSubtype;
  data: unknown;
  className?: string;
}) {
  const kind = chartSubtype ?? "bar";
  const chartData = useMemo(
    () => adaptDataToChartJs(data, chartSubtype),
    [data, chartSubtype],
  );

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-2 p-3", className)}>
      {title ? (
        <p className="text-muted-foreground text-xs font-medium">{title}</p>
      ) : null}
      <div className="relative min-h-[140px] flex-1">
        {kind === "line" ? (
          <Line
            data={chartData as ChartData<"line">}
            options={optionsBarLine}
          />
        ) : kind === "pie" ? (
          <Pie data={chartData as ChartData<"pie">} options={optionsPie} />
        ) : (
          <Bar data={chartData as ChartData<"bar">} options={optionsBarLine} />
        )}
      </div>
    </div>
  );
}
