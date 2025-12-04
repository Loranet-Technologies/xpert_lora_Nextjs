"use client";

import type React from "react";

import { useEffect, useState } from "react";
import {
  fetchERPNextTenants,
  fetchERPNextApplications,
  fetchERPNextDevices,
  fetchERPNextDeviceProfiles,
  listCsDevices,
  createCsDevice,
  updateCsDevice,
  deleteCsDevice,
} from "../../../../lib/api/api";
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
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, Smartphone } from "lucide-react";

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
  const [form, setForm] = useState({ name: "", devEui: "" });

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
  }>({
    open: false,
    device: null,
    name: "",
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
      const res = await fetchERPNextTenants({ fields: ["*"] });
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
        fields: ["*"],
        application: appId,
      });
      const data = (res as any).data || [];
      setDevices(data as Device[]);
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
    if (!selectedApp || !selectedProfile) {
      setError("Please select both application and device profile");
      return;
    }

    // Clear any previous errors
    setError(null);

    try {
      // Note: Creating devices in ERPNext would require a different API endpoint
      // For now, we'll show an error or you can implement the create endpoint
      setError("Create functionality for ERPNext devices not yet implemented");
      // await createCsDevice({
      //   name: form.name,
      //   devEui: form.devEui,
      //   applicationId: selectedApp,
      //   deviceProfileId: selectedProfile,
      // });
      // setForm({ name: "", devEui: "" });
      // setSelectedProfile(""); // Reset profile selection
      // await loadDevices(selectedApp);
    } catch (e: any) {
      console.error("Device creation error:", e);

      // Handle specific error messages
      let errorMessage = "Failed to create device";
      if (e?.message?.includes("already exists")) {
        errorMessage = `Device with DevEUI "${form.devEui}" already exists. Please use a different DevEUI.`;
      } else if (e?.message?.includes("Device profile ID is required")) {
        errorMessage = "Please select a device profile";
      } else if (e?.message) {
        errorMessage = e.message;
      }

      setError(errorMessage);
    }
  }

  async function handleEdit() {
    if (!editDialog.device || !editDialog.name.trim()) return;

    try {
      // Note: Updating devices in ERPNext would require a different API endpoint
      // For now, we'll show an error or you can implement the update endpoint
      setError("Update functionality for ERPNext devices not yet implemented");
      // await updateCsDevice(editDialog.device.dev_eui || editDialog.device.name, {
      //   name: editDialog.name,
      // });
      // await loadDevices(selectedApp);
      // setEditDialog({ open: false, device: null, name: "" });
    } catch (e: any) {
      setError(e?.message || "Failed to update device");
    }
  }

  async function handleDelete() {
    if (!deleteDialog.device) return;

    try {
      // Note: Deleting devices in ERPNext would require a different API endpoint
      // For now, we'll show an error or you can implement the delete endpoint
      setError("Delete functionality for ERPNext devices not yet implemented");
      // await deleteCsDevice(deleteDialog.device.dev_eui || deleteDialog.device.name);
      // await loadDevices(selectedApp);
      // setDeleteDialog({ open: false, device: null });
    } catch (e: any) {
      setError(e?.message || "Failed to delete device");
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mx-auto max-w-6xl space-y-8">
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
            <CardTitle>Device Selection & Creation</CardTitle>
            <CardDescription>
              Select a tenant and application to view devices (Note: Create
              functionality not yet implemented)
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
                  <Label htmlFor="device-name">Device Name</Label>
                  <Input
                    id="device-name"
                    placeholder="Enter device name..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dev-eui">DevEUI</Label>
                  <div className="flex gap-2">
                    <Input
                      id="dev-eui"
                      placeholder="Enter DevEUI..."
                      value={form.devEui}
                      onChange={(e) =>
                        setForm({ ...form, devEui: e.target.value })
                      }
                      required
                      className="flex-1"
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
              </div>
              <Button
                type="submit"
                disabled={!selectedApp || !selectedProfile}
                className="w-full md:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Device
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
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
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading devices...</span>
              </div>
            ) : (
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
                                d.status === "Active" ? "default" : "secondary"
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
                                onClick={() =>
                                  setEditDialog({
                                    open: true,
                                    device: d,
                                    name: d.device_name || "",
                                  })
                                }
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Rename
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  setDeleteDialog({
                                    open: true,
                                    device: d,
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={editDialog.open}
          onOpenChange={(open) => setEditDialog({ ...editDialog, open })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Device</DialogTitle>
              <DialogDescription>
                Update the name for device{" "}
                {editDialog.device?.dev_eui || editDialog.device?.name} (Note:
                Update functionality not yet implemented)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Device Name</Label>
              <Input
                id="edit-name"
                value={editDialog.name}
                onChange={(e) =>
                  setEditDialog({ ...editDialog, name: e.target.value })
                }
                placeholder="Enter new device name..."
                disabled
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() =>
                  setEditDialog({ open: false, device: null, name: "" })
                }
              >
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={!editDialog.name.trim()}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Device</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete device "
                {deleteDialog.device?.device_name || deleteDialog.device?.name}"
                ({deleteDialog.device?.dev_eui || deleteDialog.device?.name})?
                This action cannot be undone. (Note: Delete functionality not
                yet implemented)
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => setDeleteDialog({ open: false, device: null })}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Device
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
