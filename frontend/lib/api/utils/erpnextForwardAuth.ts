/**
 * Build headers for server-side proxy calls to Frappe/ERPNext,
 * matching the pattern used across app/api/erpnext route handlers.
 */
export function erpnextForwardHeaders(token: string): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token.startsWith("Token ")) {
    headers["Authorization"] = token;
  } else if (token.includes(":")) {
    headers["Authorization"] = "Bearer " + token;
  } else {
    headers["Cookie"] = "sid=" + token;
    headers["Authorization"] = "Bearer " + token;
  }
  return headers;
}
