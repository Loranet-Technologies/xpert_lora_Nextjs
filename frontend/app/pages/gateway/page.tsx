"use client";

import type React from "react";

import { useEffect, useState } from "react";
import {
  fetchERPNextGateways,
  fetchERPNextTenants,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Plus, Edit2, Trash2, Radio } from "lucide-react";
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
  tenant_name: string;
  chirpstack_id?: string;
} & Record<string, any>;

// ERPNext Gateway type
type Gateway = {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  gateway_name: string;
  gateway_id_mac?: string;
  chirpstack_id?: string;
  tenant?: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  altitude_meters?: number;
  network_settings?: string;
  network_server_id?: string;
  stats_interval_seconds?: number;
  status?: string;
  metadata?: any;
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

// Helper function to format coordinates
function formatCoordinates(lat?: number, lon?: number): string {
  if (lat === undefined || lon === undefined || lat === 0 || lon === 0) {
    return "—";
  }
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

export default function GatewayAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [items, setItems] = useState<Gateway[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [editingGateway, setEditingGateway] = useState<Gateway | null>(null);
  const [editName, setEditName] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  async function loadTenants() {
    try {
      const res = await fetchERPNextTenants({ fields: ["*"] });
      const data = (res as any).data || [];
      setTenants(data as Tenant[]);
    } catch (e: any) {
      console.error("Failed to load tenants:", e);
    }
  }

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchERPNextGateways({
        fields: ["*"],
        tenant:
          selectedTenant && selectedTenant !== "all"
            ? selectedTenant
            : undefined,
      });
      // ERPNext returns { data: [...] }
      const data = (res as any).data || [];
      setItems(data as Gateway[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load gateways");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    reload();
  }, [selectedTenant]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      // Note: Creating gateways in ERPNext would require a different API endpoint
      // For now, we'll show an error or you can implement the create endpoint
      setError("Create functionality for ERPNext gateways not yet implemented");
      // await createGateway({ name: newName });
      // setNewName("");
      // await reload();
    } catch (e: any) {
      setError(e?.message || "Failed to create gateway");
    }
  }

  async function onUpdate(id: string, updates: { name?: string }) {
    try {
      // Note: Updating gateways in ERPNext would require a different API endpoint
      // For now, we'll show an error or you can implement the update endpoint
      setError("Update functionality for ERPNext gateways not yet implemented");
      // await updateGateway(id, updates);
      // setIsEditDialogOpen(false);
      // setEditingGateway(null);
      // await reload();
    } catch (e: any) {
      setError(e?.message || "Failed to update gateway");
    }
  }

  function openEditDialog(gateway: Gateway) {
    setEditingGateway(gateway);
    setEditName(gateway.gateway_name || "");
    setIsEditDialogOpen(true);
  }

  async function onDelete(id: string) {
    if (!confirm("Delete gateway?")) return;
    try {
      // Note: Deleting gateways in ERPNext would require a different API endpoint
      // For now, we'll show an error or you can implement the delete endpoint
      setError("Delete functionality for ERPNext gateways not yet implemented");
      // await deleteGateway(id);
      // await reload();
    } catch (e: any) {
      setError(e?.message || "Failed to delete gateway");
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gateways</h1>
            <p className="text-muted-foreground">
              Manage gateways from ERPNext
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Gateway
            </CardTitle>
            <CardDescription>
              Note: Create functionality for ERPNext gateways not yet
              implemented
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex-1">
                <Label htmlFor="tenant-select" className="mb-2">
                  Filter by Tenant (Optional)
                </Label>
                <Select
                  value={selectedTenant}
                  onValueChange={setSelectedTenant}
                >
                  <SelectTrigger id="tenant-select" className="min-w-[260px]">
                    <SelectValue placeholder="All tenants..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tenants</SelectItem>
                    {tenants.map((t) => (
                      <SelectItem key={t.name} value={t.name}>
                        {t.tenant_name || t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <form
                onSubmit={onCreate}
                className="flex flex-col gap-4 sm:flex-row sm:items-end"
              >
                <div className="flex-1 space-y-2">
                  <Label htmlFor="name">Gateway Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter gateway name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    disabled
                  />
                </div>
                <Button type="submit" className="sm:w-auto" disabled>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Gateway
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Gateways List</CardTitle>
            <CardDescription>
              {items.length} gateway{items.length !== 1 ? "s" : ""} from ERPNext
              {selectedTenant &&
                selectedTenant !== "all" &&
                ` (filtered by tenant)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Gateway Name</TableHead>
                    <TableHead>Gateway ID/MAC</TableHead>
                    <TableHead>ChirpStack ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Coordinates</TableHead>
                    <TableHead>Created</TableHead>
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
                          <Skeleton className="h-5 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-28" />
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
                      {items.map((gateway) => (
                        <TableRow key={gateway.name}>
                        <TableCell className="font-mono text-sm">
                          <Badge variant="outline">
                            {gateway.name?.substring(0, 8)}...
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {gateway.gateway_name || "—"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {gateway.gateway_id_mac || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {gateway.chirpstack_id || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              gateway.status === "Active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {gateway.status || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {gateway.location || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm font-mono">
                          {formatCoordinates(
                            gateway.latitude,
                            gateway.longitude
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatERPNextDate(gateway.creation)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(gateway)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onDelete(gateway.name)}
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
                            No gateways found. Data is loaded from ERPNext.
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

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Gateway</DialogTitle>
              <DialogDescription>
                Update the gateway details below. (Note: Update functionality
                not yet implemented)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Gateway Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter gateway name"
                  disabled
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
              <Button
                onClick={() =>
                  editingGateway &&
                  onUpdate(editingGateway.name, {
                    name: editName,
                  })
                }
                disabled
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
