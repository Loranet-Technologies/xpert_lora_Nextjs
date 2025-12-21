"use client";

import type React from "react";

import { useEffect, useState } from "react";
import {
  fetchERPNextTenants,
  fetchERPNextApplications,
  fetchERPNextDevices,
  fetchERPNextDeviceProfiles,
  createERPNextDevice,
  updateERPNextDevice,
  deleteERPNextDevice,
} from "../../../lib/api/api";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Smartphone } from "lucide-react";

// ERPNext Tenant type
type Tenant = {
  name: string;
  tenant_name: string;
  chirpstack_id?: string;
} & Record<string, any>;

// ERPNext Application type
type Application = {
  name: string;
  application_name: string;
  tenant: string;
  chirpstack_id?: string;
} & Record<string, any>;

// ERPNext Device Profile type
type DeviceProfile = {
  name: string;
  profile_name: string;
  tenant: string;
} & Record<string, any>;

// ERPNext Device type
type Device = {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  device_name: string;
  dev_eui: string;
  application: string;
  application_chirpstack_id?: string;
  chirpstack_id?: string;
  device_profile: string;
  metadata?: any;
  status?: string;
  description?: string;
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

export default function DevicesAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [profiles, setProfiles] = useState<DeviceProfile[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", devEui: "", description: "" });

  function generateRandomDevEui() {
    const chars = "0123456789abcdef";
    let result = "";
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm({ ...form, devEui: result });
  }

  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    device: Device | null;
    name: string;
    description: string;
    status: string;
    deviceProfile: string;
  }>({
    open: false,
    device: null,
    name: "",
    description: "",
    status: "Active",
    deviceProfile: "",
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    device: Device | null;
  }>({
    open: false,
    device: null,
  });

  async function loadTenants() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchERPNextTenants({ limit: 100, offset: 0 });
      const data = (res as any).data || [];
      setTenants(data as Tenant[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  }

  async function loadApps(tenantId?: string) {
    if (!tenantId) {
      setApps([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchERPNextApplications({
        fields: ["*"],
        tenant: tenantId,
      });
      const data = (res as any).data || [];
      setApps(data as Application[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  async function loadProfiles(tenantId?: string) {
    if (!tenantId) {
      setProfiles([]);
      return;
    }
    try {
      const res = await fetchERPNextDeviceProfiles({
        fields: ["*"],
        tenant: tenantId,
      });
      const data = (res as any).data || [];
      setProfiles(data as DeviceProfile[]);
    } catch (e: any) {
      console.error("Failed to load device profiles:", e);
      setProfiles([]);
    }
  }

  async function loadDevices(appId?: string) {
    if (!appId) {
      setDevices([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchERPNextDevices({
        application: appId,
        limit: 100,
        offset: 0,
      });
      const data = (res as any).data || [];
      // Filter devices by application on client side as well to ensure correctness
      const filteredData = data.filter(
        (device: Device) => device.application === appId
      );
      setDevices(filteredData as Device[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load devices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenants();
  }, []);
  useEffect(() => {
    if (selectedTenant) {
      loadApps(selectedTenant);
      loadProfiles(selectedTenant);
    } else {
      setApps([]);
      setProfiles([]);
    }
  }, [selectedTenant]);
  useEffect(() => {
    if (selectedApp) {
      loadDevices(selectedApp);
    } else {
      setDevices([]);
    }
  }, [selectedApp]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (
      !selectedApp ||
      !selectedProfile ||
      !form.name.trim() ||
      !form.devEui.trim()
    ) {
      setError("Please fill in all required fields");
      return;
    }

    // Clear any previous errors
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await createERPNextDevice({
        device_name: form.name.trim(),
        dev_eui: form.devEui.trim(),
        application: selectedApp,
        device_profile: selectedProfile,
        status: "Active",
        description: form.description.trim() || undefined,
      });

      setForm({ name: "", devEui: "", description: "" });
      setSelectedProfile(""); // Reset profile selection
      setSuccess("Device created successfully!");
      await loadDevices(selectedApp);
    } catch (e: any) {
      console.error("Device creation error:", e);

      // Handle specific error messages
      let errorMessage = "Failed to create device";
      if (e?.message?.includes("already exists")) {
        errorMessage = `Device with DevEUI "${form.devEui}" already exists. Please use a different DevEUI.`;
      } else if (e?.message?.includes("Device profile")) {
        errorMessage = "Please select a device profile";
      } else if (e?.message?.includes("Application")) {
        errorMessage = "Please select an application";
      } else if (e?.message) {
        errorMessage = e.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit() {
    if (!editDialog.device || !editDialog.name.trim()) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await updateERPNextDevice(editDialog.device.name, {
        device_name: editDialog.name.trim(),
        description: editDialog.description.trim() || undefined,
        status: editDialog.status,
        device_profile:
          editDialog.deviceProfile || editDialog.device.device_profile,
      });

      setSuccess("Device updated successfully!");
      await loadDevices(selectedApp);
      setEditDialog({
        open: false,
        device: null,
        name: "",
        description: "",
        status: "Active",
        deviceProfile: "",
      });
    } catch (e: any) {
      setError(e?.message || "Failed to update device");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteDialog.device) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await deleteERPNextDevice(deleteDialog.device.name);
      setSuccess("Device deleted successfully!");
      await loadDevices(selectedApp);
      setDeleteDialog({ open: false, device: null });
    } catch (e: any) {
      setError(e?.message || "Failed to delete device");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="flex items-center gap-3">
          <Smartphone className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Device Management
            </h1>
            <p className="text-muted-foreground">
              Manage IoT devices from ERPNext
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Device
            </CardTitle>
            <CardDescription>
              Create a new device in ERPNext. The device will be synced with
              ChirpStack.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenant-select">Tenant</Label>
                <Select
                  value={selectedTenant}
                  onValueChange={(value) => {
                    setSelectedTenant(value);
                    setSelectedApp("");
                  }}
                >
                  <SelectTrigger id="tenant-select">
                    <SelectValue placeholder="Select tenant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((t) => (
                      <SelectItem key={t.name} value={t.name}>
                        {t.tenant_name || t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="app-select">Application</Label>
                <Select
                  value={selectedApp}
                  onValueChange={setSelectedApp}
                  disabled={!selectedTenant}
                >
                  <SelectTrigger id="app-select">
                    <SelectValue placeholder="Select application..." />
                  </SelectTrigger>
                  <SelectContent>
                    {apps.map((a) => (
                      <SelectItem key={a.name} value={a.name}>
                        {a.application_name || a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-select">Device Profile</Label>
              <Select
                value={selectedProfile}
                onValueChange={setSelectedProfile}
                disabled={!selectedTenant}
              >
                <SelectTrigger id="profile-select">
                  <SelectValue placeholder="Select device profile..." />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.name} value={p.name}>
                      {p.profile_name || p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <form onSubmit={onCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="device-name">Device Name *</Label>
                  <Input
                    id="device-name"
                    placeholder="Enter device name..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dev-eui">DevEUI *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="dev-eui"
                      placeholder="Enter DevEUI (16 hex characters)..."
                      value={form.devEui}
                      onChange={(e) =>
                        setForm({ ...form, devEui: e.target.value })
                      }
                      required
                      className="flex-1"
                      pattern="[0-9a-fA-F]{16}"
                      maxLength={16}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateRandomDevEui}
                      className="px-3"
                    >
                      Generate
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="device-description">Description</Label>
                  <Input
                    id="device-description"
                    placeholder="Enter description (optional)..."
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={
                    !selectedApp ||
                    !selectedProfile ||
                    !form.name.trim() ||
                    !form.devEui.trim() ||
                    loading
                  }
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Device
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

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
            <CardTitle>Devices</CardTitle>
            <CardDescription>
              {selectedApp
                ? `${devices.length} device${
                    devices.length !== 1 ? "s" : ""
                  } from ERPNext`
                : "Select an application to view devices"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Device Name</TableHead>
                    <TableHead>DevEUI</TableHead>
                    <TableHead>ChirpStack ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
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
                          <Skeleton className="h-5 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-28" />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-8 w-16" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <>
                      {devices.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center py-8 text-muted-foreground"
                          >
                            {selectedApp
                              ? "No devices found"
                              : "Select an application to view devices"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        devices.map((d) => (
                          <TableRow key={d.name}>
                            <TableCell className="font-mono text-sm">
                              <Badge variant="outline">
                                {d.name?.substring(0, 8)}...
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {d.device_name || "—"}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {d.dev_eui || "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {d.chirpstack_id || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  d.status === "Active"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {d.status || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {d.description || "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatERPNextDate(d.creation)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditDialog({
                                      open: true,
                                      device: d,
                                      name: d.device_name || "",
                                      description: d.description || "",
                                      status: d.status || "Active",
                                      deviceProfile: d.device_profile || "",
                                    });
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete Device
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete &quot;
                                        {d.device_name || d.name}&quot; (DevEUI:{" "}
                                        {d.dev_eui || d.name})? This action
                                        cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => {
                                          setDeleteDialog({
                                            open: true,
                                            device: d,
                                          });
                                          setTimeout(() => handleDelete(), 0);
                                        }}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog
          open={editDialog.open}
          onOpenChange={(open) => setEditDialog({ ...editDialog, open })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Device</DialogTitle>
              <DialogDescription>
                Update the device details. Changes will be synced with
                ChirpStack.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Device Name *</Label>
                <Input
                  id="edit-name"
                  value={editDialog.name}
                  onChange={(e) =>
                    setEditDialog({ ...editDialog, name: e.target.value })
                  }
                  placeholder="Enter device name..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editDialog.description}
                  onChange={(e) =>
                    setEditDialog({
                      ...editDialog,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter description (optional)..."
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editDialog.status}
                  onValueChange={(value) =>
                    setEditDialog({ ...editDialog, status: value })
                  }
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setEditDialog({
                    open: false,
                    device: null,
                    name: "",
                    description: "",
                    status: "Active",
                    deviceProfile: "",
                  })
                }
              >
                Cancel
              </Button>
              <Button
                onClick={handleEdit}
                disabled={!editDialog.name.trim() || loading}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
