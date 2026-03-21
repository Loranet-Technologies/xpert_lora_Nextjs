"use client";

import { useState } from "react";
import { format as formatDate } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useAuth } from "@/lib/auth/AuthProvider";
import { listActivityLogs } from "@/lib/activity-log/api";
import { ACTIVITY_ACTIONS } from "@/lib/activity-log/types";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

function actorLabel(row: {
  user?: string | null;
  user_identifier?: string | null;
}) {
  return row.user || row.user_identifier || "—";
}

function parseDateValue(value: string): Date | undefined {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00`);
}

export default function ActivityLogsPage() {
  const { user } = useAuth();
  const currentUserRole = user?.role?.toLowerCase() || "";
  const canView =
    currentUserRole === "admin" || currentUserRole === "superadmin";

  const [userFilter, setUserFilter] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [draftFromDate, setDraftFromDate] = useState("");
  const [draftToDate, setDraftToDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const hasPendingDateChanges =
    draftFromDate !== fromDate || draftToDate !== toDate;

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: [
      "activity-logs",
      userFilter,
      actionFilter,
      statusFilter,
      fromDate,
      toDate,
      page,
    ],
    queryFn: () =>
      listActivityLogs({
        user: userFilter.trim() || undefined,
        action: actionFilter === "all" ? undefined : actionFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        from: fromDate || undefined,
        to: toDate || undefined,
        page,
        limit: pageSize,
      }),
    enabled: canView,
  });

  const applyDateFilter = () => {
    setFromDate(draftFromDate);
    setToDate(draftToDate);
    setPage(1);
  };

  const resetFilters = () => {
    setUserFilter("");
    setActionFilter("all");
    setStatusFilter("all");
    setDraftFromDate("");
    setDraftToDate("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const logs = data?.data ?? [];
  const totalPages = data?.total_pages ?? 1;
  const total = data?.total ?? 0;

  if (!canView) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header title="Activity logs" />
          <div className="flex flex-1 flex-col gap-4 p-6">
            <Card className="max-w-lg mx-auto mt-12">
              <CardContent className="pt-6 flex flex-col items-center gap-3 text-center">
                <ShieldAlert className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  You do not have permission to view user activity logs. Admin
                  access is required.
                </p>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header title="User activity" />
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="mx-auto w-full max-w-7xl space-y-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Activity logs
              </h1>
              <p className="text-sm text-muted-foreground">
                Data from ERPNext User Activity Log (authentication, profile
                changes, passwords).
              </p>
            </div>

            <Card className="border-0 overflow-hidden">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex flex-col lg:flex-row gap-3 flex-wrap items-end">
                  <div className="grid w-full sm:grid-cols-2 lg:grid-cols-5 gap-3 flex-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        User
                      </label>
                      <Input
                        placeholder="Username or email"
                        value={userFilter}
                        onChange={(e) => {
                          setUserFilter(e.target.value);
                          setPage(1);
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Action
                      </label>
                      <Select
                        value={actionFilter}
                        onValueChange={(v) => {
                          setActionFilter(v);
                          setPage(1);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All actions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All actions</SelectItem>
                          {ACTIVITY_ACTIONS.map((a) => (
                            <SelectItem key={a} value={a}>
                              {a}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                          <SelectValue placeholder="All status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All status</SelectItem>
                          <SelectItem value="Success">Success</SelectItem>
                          <SelectItem value="Failed">Failed</SelectItem>
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
                              ? formatDate(parseDateValue(draftFromDate) as Date, "yyyy-MM-dd")
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={parseDateValue(draftFromDate)}
                            onSelect={(date) => {
                              setDraftFromDate(
                                date ? formatDate(date, "yyyy-MM-dd") : ""
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
                              ? formatDate(parseDateValue(draftToDate) as Date, "yyyy-MM-dd")
                              : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={parseDateValue(draftToDate)}
                            onSelect={(date) => {
                              setDraftToDate(
                                date ? formatDate(date, "yyyy-MM-dd") : ""
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
                    Apply
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isFetching}
                    onClick={resetFilters}
                  >
                    {isFetching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Reset"
                    )}
                  </Button>
                </div>

                {error && (
                  <p className="text-sm text-destructive">
                    {error instanceof Error ? error.message : "Failed to load"}
                  </p>
                )}

                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Time</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead className="min-w-[160px]">Device</TableHead>
                        <TableHead className="min-w-[120px]">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : logs.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No activity matches the current filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        logs.map((row) => (
                          <TableRow key={row.name}>
                            <TableCell className="whitespace-nowrap text-xs font-mono">
                              {row.timestamp
                                ? formatDate(
                                    new Date(row.timestamp),
                                    "yyyy-MM-dd HH:mm:ss"
                                  )
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-xs font-normal",
                                  row.action === "Login Failed" &&
                                    "border-red-200 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200",
                                  row.action === "Login Success" &&
                                    "border-green-200 bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200"
                                )}
                              >
                                {row.action}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "text-xs",
                                  row.status === "Failed"
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-muted-foreground"
                                )}
                              >
                                {row.status || "—"}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm max-w-[120px] truncate">
                              {actorLabel(row)}
                            </TableCell>
                            <TableCell className="text-sm max-w-[120px] truncate">
                              {row.subject_user || "—"}
                            </TableCell>
                            <TableCell className="text-xs font-mono">
                              {row.ip_address || "—"}
                            </TableCell>
                            <TableCell
                              className="text-xs text-muted-foreground max-w-[200px] truncate"
                              title={
                                row.device_info ||
                                row.user_agent ||
                                undefined
                              }
                            >
                              {row.device_info || row.user_agent || "—"}
                            </TableCell>
                            <TableCell
                              className="text-xs text-muted-foreground max-w-[180px] truncate"
                              title={row.details || undefined}
                            >
                              {row.details || "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
                  <span>
                    {total} event{total !== 1 ? "s" : ""} total
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
      </SidebarInset>
    </SidebarProvider>
  );
}
