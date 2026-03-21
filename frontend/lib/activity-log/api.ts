import { getERPNextToken } from "@/lib/api/utils/token";
import type { ActivityLogEntry } from "./types";

export interface ListActivityLogsResponse {
  success: boolean;
  data: ActivityLogEntry[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export async function listActivityLogs(params: {
  user?: string;
  action?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}): Promise<ListActivityLogsResponse> {
  const token = await getERPNextToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const sp = new URLSearchParams();
  if (params.user) sp.set("user", params.user);
  if (params.action) sp.set("action", params.action);
  if (params.status) sp.set("status", params.status);
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));

  const q = sp.toString();
  const url = `/api/erpnext/user-activity-log${q ? `?${q}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const json = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok || json.success === false) {
    const msg =
      (typeof json.message === "string" && json.message) ||
      (typeof json.error === "string" && json.error) ||
      "Failed to load activity logs";
    throw new Error(msg);
  }

  const data = Array.isArray(json.data) ? json.data : [];
  const total = typeof json.total === "number" ? json.total : data.length;
  const page = typeof json.page === "number" ? json.page : params.page ?? 1;
  const limit =
    typeof json.limit === "number"
      ? json.limit
      : typeof json.page_length === "number"
        ? json.page_length
        : params.limit ?? 25;
  const total_pages =
    typeof json.total_pages === "number"
      ? json.total_pages
      : Math.max(1, Math.ceil(total / limit));

  return {
    success: true,
    data: data as ActivityLogEntry[],
    total,
    page,
    limit,
    total_pages,
  };
}
