"use client";

import { cn } from "@/lib/utils";

function extractNumber(data: unknown): number | null {
  if (typeof data === "number" && Number.isFinite(data)) return data;
  if (typeof data === "string") {
    const n = Number(data);
    if (Number.isFinite(n)) return n;
  }
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const o = data as Record<string, unknown>;
    const keys = ["value", "count", "total", "kpi", "result", "number"];
    for (const k of keys) {
      const v = o[k];
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (typeof v === "string") {
        const n = Number(v);
        if (Number.isFinite(n)) return n;
      }
    }
  }
  return null;
}

export function KPIWidget({
  title,
  data,
  className,
}: {
  title?: string;
  data: unknown;
  className?: string;
}) {
  const n = extractNumber(data);
  const label =
    data && typeof data === "object" && !Array.isArray(data)
      ? String((data as Record<string, unknown>).label ?? "")
      : "";

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col justify-center gap-1 p-3",
        className,
      )}
    >
      {title ? (
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {title}
        </p>
      ) : null}
      <div className="text-3xl font-semibold tabular-nums">
        {n != null ? n.toLocaleString() : "—"}
      </div>
      {label ? (
        <p className="text-muted-foreground text-xs">{label}</p>
      ) : null}
    </div>
  );
}
