import type { ChartData } from "chart.js";
import type { ChartSubtype } from "@/lib/api/custom-dashboard/types";

export function adaptDataToChartJs(
  data: unknown,
  chartSubtype: ChartSubtype | undefined,
): ChartData<"bar" | "line" | "pie"> {
  const kind = chartSubtype ?? "bar";

  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.labels) && Array.isArray(o.datasets)) {
      return {
        labels: o.labels.map(String),
        datasets: o.datasets as ChartData<"bar">["datasets"],
      };
    }
    if (Array.isArray(o.series) && o.series.length) {
      const series = o.series as { name?: string; data?: number[] }[];
      const labels =
        (Array.isArray(o.categories) ? o.categories : null)?.map(String) ??
        series[0]?.data?.map((_, i) => String(i + 1)) ??
        [];
      const datasets = series.map((s, idx) => ({
        label: s.name ?? `Series ${idx + 1}`,
        data: Array.isArray(s.data) ? s.data : [],
        backgroundColor:
          kind === "pie"
            ? [
                "hsl(var(--chart-1))",
                "hsl(var(--chart-2))",
                "hsl(var(--chart-3))",
                "hsl(var(--chart-4))",
                "hsl(var(--chart-5))",
              ]
            : "hsl(var(--chart-1) / 0.5)",
        borderColor: "hsl(var(--chart-1))",
        borderWidth: 1,
      }));
      return { labels, datasets };
    }
    if (Array.isArray(o.rows) && o.rows.length) {
      const rows = o.rows as Record<string, unknown>[];
      const keys = Object.keys(rows[0] ?? {});
      const labelKey = keys[0] ?? "label";
      const valueKey = keys.find((k) => k !== labelKey) ?? keys[1] ?? "value";
      return {
        labels: rows.map((r) => String(r[labelKey] ?? "")),
        datasets: [
          {
            label: String(valueKey),
            data: rows.map((r) => Number(r[valueKey]) || 0),
            backgroundColor:
              kind === "pie"
                ? [
                    "hsl(var(--chart-1))",
                    "hsl(var(--chart-2))",
                    "hsl(var(--chart-3))",
                  ]
                : "hsl(var(--chart-1) / 0.45)",
            borderColor: "hsl(var(--chart-1))",
            borderWidth: 1,
          },
        ],
      };
    }
  }

  return {
    labels: ["A", "B", "C"],
    datasets: [
      {
        label: "Values",
        data: [0, 0, 0],
        backgroundColor: "hsl(var(--muted))",
        borderColor: "hsl(var(--border))",
        borderWidth: 1,
      },
    ],
  };
}
