"use client";

import type React from "react";

import { useEffect, useState } from "react";
import {
  fetchERPNextTenants,
  createERPNextTenant,
  updateERPNextTenant,
  deleteERPNextTenant,
} from "../../../lib/api/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit2, Trash2, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ERPNext Tenant type
type Tenant = {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  tenant_name: string;
  chirpstack_id?: string;
  description?: string;
  can_have_gateways?: number;
  max_gateway_count?: number;
  max_device_count?: number;
} & Record<string, any>;

// Helper function to format ERPNext date
function formatERPNextDate(dateString?: string): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  } catch {
    return dateString;
  }
}

export default function OrganizationsAdminPage() {
  const [items, setItems] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create form state
  const [newTenantName, setNewTenantName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCanHaveGateways, setNewCanHaveGateways] = useState(false);
  const [newMaxGatewayCount, setNewMaxGatewayCount] = useState<
    number | undefined
  >();
  const [newMaxDeviceCount, setNewMaxDeviceCount] = useState<
    number | undefined
  >();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Edit form state
  const [editingOrg, setEditingOrg] = useState<Tenant | null>(null);
  const [editTenantName, setEditTenantName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCanHaveGateways, setEditCanHaveGateways] = useState(false);
  const [editMaxGatewayCount, setEditMaxGatewayCount] = useState<
    number | undefined
  >();
  const [editMaxDeviceCount, setEditMaxDeviceCount] = useState<
    number | undefined
  >();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  async function reload() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetchERPNextTenants({ limit: 100, offset: 0 });
      // API returns { data: [...], total: number } or { message: { data: [...], total: number } }
      let data: Tenant[] = [];

      if (res) {
        // Handle direct response
        if (Array.isArray(res)) {
          data = res;
        } else if (res.data && Array.isArray(res.data)) {
          data = res.data;
        } else if (res.message) {
          // Handle wrapped response
          if (Array.isArray(res.message)) {
            data = res.message;
          } else if (res.message.data && Array.isArray(res.message.data)) {
            data = res.message.data;
          }
        }
      }

      setItems(data);
    } catch (e: any) {
      console.error("Failed to load tenants:", e);
      setError(e?.message || "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const tenantData: any = {
        tenant_name: newTenantName,
        description: newDescription || undefined,
        can_have_gateways: newCanHaveGateways ? 1 : 0,
      };

      if (newMaxGatewayCount !== undefined && newMaxGatewayCount !== null) {
        tenantData.max_gateway_count = newMaxGatewayCount;
      }
      if (newMaxDeviceCount !== undefined && newMaxDeviceCount !== null) {
        tenantData.max_device_count = newMaxDeviceCount;
      }

      await createERPNextTenant(tenantData);

      // Reset form
      setNewTenantName("");
      setNewDescription("");
      setNewCanHaveGateways(false);
      setNewMaxGatewayCount(undefined);
      setNewMaxDeviceCount(undefined);
      setIsCreateDialogOpen(false);
      setSuccess("Tenant created successfully!");

      await reload();
    } catch (e: any) {
      setError(e?.message || "Failed to create tenant");
    }
  }

  async function onUpdate() {
    if (!editingOrg) return;

    setError(null);
    setSuccess(null);
    try {
      const updates: any = {
        tenant_name: editTenantName,
        description: editDescription || undefined,
        can_have_gateways: editCanHaveGateways ? 1 : 0,
      };

      if (editMaxGatewayCount !== undefined && editMaxGatewayCount !== null) {
        updates.max_gateway_count = editMaxGatewayCount;
      }
      if (editMaxDeviceCount !== undefined && editMaxDeviceCount !== null) {
        updates.max_device_count = editMaxDeviceCount;
      }

      await updateERPNextTenant(editingOrg.name, updates);

      setIsEditDialogOpen(false);
      setEditingOrg(null);
      setSuccess("Tenant updated successfully!");

      await reload();
    } catch (e: any) {
      setError(e?.message || "Failed to update tenant");
    }
  }

  function openEditDialog(org: Tenant) {
    setEditingOrg(org);
    setEditTenantName(org.tenant_name || "");
    setEditDescription(org.description || "");
    setEditCanHaveGateways(org.can_have_gateways === 1);
    setEditMaxGatewayCount(org.max_gateway_count);
    setEditMaxDeviceCount(org.max_device_count);
    setIsEditDialogOpen(true);
  }

  async function onDelete(id: string) {
    if (
      !confirm(
        "Are you sure you want to delete this tenant? This action cannot be undone."
      )
    )
      return;

    setError(null);
    setSuccess(null);
    try {
      await deleteERPNextTenant(id);
      setSuccess("Tenant deleted successfully!");
      await reload();
    } catch (e: any) {
      setError(e?.message || "Failed to delete tenant");
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Organizations (Tenants)
            </h1>
            <p className="text-muted-foreground">Manage tenants from ERPNext</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div></div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Tenant
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Organizations List</CardTitle>
            <CardDescription>
              {items.length} tenant{items.length !== 1 ? "s" : ""} from ERPNext
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tenant Name</TableHead>
                    <TableHead>ChirpStack ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Gateways</TableHead>
                    <TableHead>Max Gateways</TableHead>
                    <TableHead>Max Devices</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-12" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-12" />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <>
                      {items.map((tenant) => (
                        <TableRow key={tenant.name}>
                        <TableCell className="font-mono text-sm">
                          <Badge variant="outline">
                            {tenant.name?.substring(0, 8)}...
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {tenant.tenant_name || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {tenant.chirpstack_id || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {tenant.description || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatERPNextDate(tenant.creation)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              tenant.can_have_gateways === 1
                                ? "default"
                                : "secondary"
                            }
                          >
                            {tenant.can_have_gateways === 1
                              ? "Enabled"
                              : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {tenant.max_gateway_count || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {tenant.max_device_count || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(tenant)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onDelete(tenant.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      ))}
                      {items.length === 0 && !loading && (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No tenants found. Data is loaded from ERPNext.
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
              <DialogDescription>
                Create a new tenant in ERPNext. The tenant will be synced with
                ChirpStack.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-tenant-name">Tenant Name *</Label>
                <Input
                  id="new-tenant-name"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="Enter tenant name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-description">Description</Label>
                <Input
                  id="new-description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Enter description (optional)"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="new-can-have-gateways"
                  checked={newCanHaveGateways}
                  onChange={(e) => setNewCanHaveGateways(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label
                  htmlFor="new-can-have-gateways"
                  className="cursor-pointer"
                >
                  Can Have Gateways
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-max-gateway-count">Max Gateway Count</Label>
                <Input
                  id="new-max-gateway-count"
                  type="number"
                  value={newMaxGatewayCount || ""}
                  onChange={(e) =>
                    setNewMaxGatewayCount(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="Enter max gateway count (optional)"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-max-device-count">Max Device Count</Label>
                <Input
                  id="new-max-device-count"
                  type="number"
                  value={newMaxDeviceCount || ""}
                  onChange={(e) =>
                    setNewMaxDeviceCount(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="Enter max device count (optional)"
                  min="0"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Tenant</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Tenant</DialogTitle>
              <DialogDescription>
                Update the tenant details below. Changes will be synced with
                ChirpStack.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tenant-name">Tenant Name *</Label>
                <Input
                  id="edit-tenant-name"
                  value={editTenantName}
                  onChange={(e) => setEditTenantName(e.target.value)}
                  placeholder="Enter tenant name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Enter description (optional)"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-can-have-gateways"
                  checked={editCanHaveGateways}
                  onChange={(e) => setEditCanHaveGateways(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label
                  htmlFor="edit-can-have-gateways"
                  className="cursor-pointer"
                >
                  Can Have Gateways
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-max-gateway-count">
                  Max Gateway Count
                </Label>
                <Input
                  id="edit-max-gateway-count"
                  type="number"
                  value={editMaxGatewayCount || ""}
                  onChange={(e) =>
                    setEditMaxGatewayCount(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="Enter max gateway count (optional)"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-max-device-count">Max Device Count</Label>
                <Input
                  id="edit-max-device-count"
                  type="number"
                  value={editMaxDeviceCount || ""}
                  onChange={(e) =>
                    setEditMaxDeviceCount(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  placeholder="Enter max device count (optional)"
                  min="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={onUpdate}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
