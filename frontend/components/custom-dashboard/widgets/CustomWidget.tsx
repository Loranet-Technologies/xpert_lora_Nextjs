"use client";

import { cn } from "@/lib/utils";

export function CustomWidget({
  title,
  source,
  data,
  className,
}: {
  title?: string;
  source?: string;
  data: unknown;
  className?: string;
}) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-2 p-3", className)}>
      <div className="flex items-center justify-between gap-2">
        {title ? (
          <p className="text-muted-foreground text-xs font-medium">{title}</p>
        ) : (
          <span />
        )}
        {source ? (
          <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] uppercase">
            {source}
          </span>
        ) : null}
      </div>
      <pre className="bg-muted/50 text-muted-foreground max-h-full min-h-0 flex-1 overflow-auto rounded-md p-2 text-xs leading-relaxed">
        {formatPayload(data)}
      </pre>
    </div>
  );
}

function formatPayload(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}
