"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function rowsFromData(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter((r) => r && typeof r === "object") as Record<
      string,
      unknown
    >[];
  }
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.rows)) {
      return o.rows.filter((r) => r && typeof r === "object") as Record<
        string,
        unknown
      >[];
    }
    if (Array.isArray(o.data)) {
      return o.data.filter((r) => r && typeof r === "object") as Record<
        string,
        unknown
      >[];
    }
  }
  return [];
}

export function TableWidget({
  title,
  data,
  className,
}: {
  title?: string;
  data: unknown;
  className?: string;
}) {
  const rows = rowsFromData(data);
  const columns =
    rows.length > 0 ? Object.keys(rows[0] as object) : ([] as string[]);

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-2 p-3", className)}>
      {title ? (
        <p className="text-muted-foreground text-xs font-medium">{title}</p>
      ) : null}
      <div className="min-h-0 flex-1 overflow-auto rounded-md border">
        {rows.length === 0 ? (
          <p className="text-muted-foreground p-4 text-sm">No rows</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c} className="whitespace-nowrap">
                    {c}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 200).map((row, i) => (
                <TableRow key={i}>
                  {columns.map((c) => (
                    <TableCell key={c} className="max-w-[240px] truncate">
                      {formatCell(row[c])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
