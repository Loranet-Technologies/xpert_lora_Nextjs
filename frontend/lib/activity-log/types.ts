/** Matches DocType "User Activity Log" → field `action` (Select options). */
export const ACTIVITY_ACTIONS = [
  "Login Success",
  "Login Failed",
  "Logout",
  "Password Change",
  "Password Reset",
  "Profile Update",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

/** Normalized row for the activity table (from list_user_activity_logs). */
export interface ActivityLogEntry {
  name: string;
  timestamp: string;
  action: string;
  status?: string;
  user?: string | null;
  user_identifier?: string | null;
  subject_user?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  device_info?: string | null;
  details?: string | null;
}

export interface ActivityLogQuery {
  user?: string;
  action?: ActivityAction | "";
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
