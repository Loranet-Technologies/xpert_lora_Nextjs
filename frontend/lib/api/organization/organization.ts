import { getERPNextToken } from "../utils/token";

export interface CreateOrganizationData {
  organization_name: string;
  organization_type: string;
  contact_email?: string;
  contact_phone?: string;
  billing_address?: string;
}

/**
 * Create an organization in ERPNext. Returns the new organization name (id).
 */
export async function createOrganization(
  orgData: CreateOrganizationData
): Promise<string> {
  const token = await getERPNextToken();
  if (!token) {
    throw new Error("Authentication token not found");
  }
  if (!orgData.organization_name?.trim()) {
    throw new Error("Organization name is required");
  }
  if (!orgData.organization_type) {
    throw new Error("Organization type is required");
  }

  const payload: Record<string, string> = {
    organization_name: orgData.organization_name.trim(),
    organization_type: orgData.organization_type,
  };
  if (orgData.contact_email?.trim()) {
    payload.contact_email = orgData.contact_email.trim();
  }
  if (orgData.contact_phone?.trim()) {
    payload.contact_phone = orgData.contact_phone.trim();
  }
  if (orgData.billing_address?.trim()) {
    payload.billing_address = orgData.billing_address.trim();
  }

  const response = await fetch("/api/erpnext/organization", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Failed to create organization",
    }));
    const errorMessage =
      errorData.message || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }

  const result = await response.json();
  const orgId =
    result.data?.name || result.data?.data?.name || result.name || result.data;

  if (!orgId) {
    throw new Error(
      "Organization created but failed to get organization ID"
    );
  }

  return orgId;
}
