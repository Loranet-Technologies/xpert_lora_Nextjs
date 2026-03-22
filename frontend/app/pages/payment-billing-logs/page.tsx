"use client";

import { useState } from "react";
import { format as formatDate } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  getPaymentBillingLogs,
  getPaymentBillingLogPayload,
  PAYMENT_BILLING_STATUSES,
  type PaymentBillingLogRow,
} from "@/lib/api/payment/payment-billing-logs";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileJson2,
} from "lucide-react";
import { cn } from "@/lib/utils";

function parseDateValue(value: string): Date | undefined {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00`);
}

function statusBadgeClass(status: string | null | undefined) {
  const s = (status || "").toLowerCase();
  if (s === "failed" || s === "cancelled") {
    return "border-red-200 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200";
  }
  if (s === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200";
  }
  if (s === "processing" || s === "initiated") {
    return "border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200";
  }
  return "";
}

function formatAmount(
  amount: number | null | undefined,
  currency: string | null | undefined,
) {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  const cur = (currency || "").trim();
  try {
    return new Intl.NumberFormat(undefined, {
      style: cur ? "currency" : "decimal",
      currency: cur || "USD",
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${amount} ${cur || ""}`.trim();
  }
}

function prettyJson(raw: string | null | undefined): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw;
  }
}

export default function PaymentBillingLogsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [draftFromDate, setDraftFromDate] = useState("");
  const [draftToDate, setDraftToDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const [payloadRow, setPayloadRow] = useState<PaymentBillingLogRow | null>(
    null,
  );
  const [payloadText, setPayloadText] = useState<string | null>(null);
  const [payloadLoading, setPayloadLoading] = useState(false);
  const [payloadError, setPayloadError] = useState<string | null>(null);

  const hasPendingDateChanges =
    draftFromDate !== fromDate || draftToDate !== toDate;

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["payment-billing-logs", statusFilter, fromDate, toDate, page],
    queryFn: () =>
      getPaymentBillingLogs({
        status: statusFilter === "all" ? undefined : statusFilter,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        limit: pageSize,
        start: (page - 1) * pageSize,
        include_payload: false,
      }),
    enabled: isAuthenticated,
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const applyDateFilter = () => {
    setFromDate(draftFromDate);
    setToDate(draftToDate);
    setPage(1);
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setDraftFromDate("");
    setDraftToDate("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const openPayload = async (row: PaymentBillingLogRow) => {
    setPayloadRow(row);
    setPayloadText(null);
    setPayloadError(null);
    setPayloadLoading(true);
    try {
      const raw = await getPaymentBillingLogPayload(row, {
        status: statusFilter === "all" ? undefined : statusFilter,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        limit: pageSize,
        start: (page - 1) * pageSize,
      });
      setPayloadText(raw);
      if (!raw) setPayloadError("No gateway response stored for this row.");
    } catch (e) {
      setPayloadError(
        e instanceof Error ? e.message : "Failed to load response",
      );
    } finally {
      setPayloadLoading(false);
    }
  };

  const copyPayload = async () => {
    if (!payloadText) return;
    try {
      await navigator.clipboard.writeText(prettyJson(payloadText));
    } catch {
      /* ignore */
    }
  };

  if (authLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header title="Payment & billing logs" />
          <div className="flex flex-1 items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header title="Payment & billing logs" />
          <div className="flex flex-1 flex-col gap-4 p-6">
            <p className="text-sm text-muted-foreground">
              Please sign in to view payment and billing logs.
            </p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header title="Payment & billing logs" />
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="mx-auto w-full max-w-[1600px] space-y-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Payment & billing logging
              </h1>
              <p className="text-sm text-muted-foreground">
                Payment Transaction Log: track all financial transactions and
                payment gateway responses.
              </p>
            </div>

            <Card className="border-0 overflow-hidden">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex flex-col lg:flex-row gap-3 flex-wrap items-end">
                  <div className="grid w-full gap-3 flex-1 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Status
                      </label>
                      <Select
                        value={statusFilter}
                        onValueChange={(v) => {
                          setStatusFilter(v);
                          setPage(1);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          {PAYMENT_BILLING_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        From
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {draftFromDate
                              ? formatDate(
                                  parseDateValue(draftFromDate) as Date,
                                  "yyyy-MM-dd",
                                )
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={parseDateValue(draftFromDate)}
                            onSelect={(date) => {
                              setDraftFromDate(
                                date ? formatDate(date, "yyyy-MM-dd") : "",
                              );
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        To
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {draftToDate
                              ? formatDate(
                                  parseDateValue(draftToDate) as Date,
                                  "yyyy-MM-dd",
                                )
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={parseDateValue(draftToDate)}
                            onSelect={(date) => {
                              setDraftToDate(
                                date ? formatDate(date, "yyyy-MM-dd") : "",
                              );
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!hasPendingDateChanges || isFetching}
                    onClick={applyDateFilter}
                  >
                    Apply dates
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isFetching}
                    onClick={resetFilters}
                  >
                    Reset filters
                  </Button>
                </div>

                {error && (
                  <p className="text-sm text-destructive">
                    {error instanceof Error
                      ? error.message
                      : "Failed to load logs"}
                  </p>
                )}

                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">
                          Transaction ID
                        </TableHead>

                        <TableHead>Event</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="whitespace-nowrap">
                          Time
                        </TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Payment request</TableHead>
                        <TableHead>Gateway event</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Processed</TableHead>
                        <TableHead className="min-w-[120px]">Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={12} className="text-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : rows.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={12}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No log entries match the current filters, or you do
                            not have permission to read Payment Transaction Log.
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.map((row) => {
                          const tid =
                            row.transaction_id || row.gateway_reference || "—";
                          const processed =
                            row.is_processed === 1 || row.is_processed === true;
                          return (
                            <TableRow key={row.name}>
                              <TableCell
                                className="text-xs font-mono max-w-[140px] truncate"
                                title={tid !== "—" ? String(tid) : undefined}
                              >
                                {tid}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className="text-xs font-normal max-w-[200px] truncate"
                                >
                                  {row.event_type || "—"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs font-normal",
                                    statusBadgeClass(row.status),
                                  )}
                                >
                                  {row.status || "—"}
                                </Badge>
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-xs font-mono">
                                {row.creation
                                  ? formatDate(
                                      new Date(row.creation),
                                      "yyyy-MM-dd HH:mm",
                                    )
                                  : "—"}
                              </TableCell>

                              <TableCell className="text-right text-sm tabular-nums">
                                {formatAmount(row.amount, row.currency)}
                              </TableCell>
                              <TableCell
                                className="text-xs max-w-[120px] truncate"
                                title={row.payment_request || undefined}
                              >
                                {row.payment_request || "—"}
                              </TableCell>
                              <TableCell
                                className="text-xs max-w-[140px] truncate"
                                title={row.gateway_event || undefined}
                              >
                                {row.gateway_event || "—"}
                              </TableCell>
                              <TableCell
                                className="text-xs max-w-[160px] truncate"
                                title={row.reference_name || undefined}
                              >
                                {row.reference_doctype && row.reference_name
                                  ? `${row.reference_doctype}: ${row.reference_name}`
                                  : "—"}
                              </TableCell>
                              <TableCell
                                className="text-xs max-w-[120px] truncate"
                                title={row.organization || undefined}
                              >
                                {row.organization || "—"}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {processed ? "Yes" : "No"}
                              </TableCell>
                              <TableCell
                                className="text-xs text-destructive max-w-[160px] truncate"
                                title={row.error_message || undefined}
                              >
                                {row.error_message || "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
                  <span>
                    {total} entr{total !== 1 ? "ies" : "y"} total
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || isFetching}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span>
                      Page {page} / {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages || isFetching}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog
          open={payloadRow !== null}
          onOpenChange={(open) => {
            if (!open) {
              setPayloadRow(null);
              setPayloadText(null);
              setPayloadError(null);
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-2 pr-8">
                <span>Gateway response</span>
                {payloadText ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyPayload}
                  >
                    Copy JSON
                  </Button>
                ) : null}
              </DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-hidden flex flex-col gap-2">
              {payloadRow && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {payloadRow.name}
                    {payloadRow.event_type ? ` · ${payloadRow.event_type}` : ""}
                  </p>
                  {payloadRow.error_message ? (
                    <p className="text-xs text-destructive">
                      {payloadRow.error_message}
                    </p>
                  ) : null}
                </div>
              )}
              {payloadLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : payloadError ? (
                <p className="text-sm text-destructive">{payloadError}</p>
              ) : (
                <pre className="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-auto max-h-[60vh] whitespace-pre-wrap break-all">
                  {prettyJson(payloadText) || "—"}
                </pre>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
