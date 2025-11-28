"use client";

import type React from "react";

import { useEffect, useState } from "react";
import {
  listOrganizations,
  listCsApplications,
  listCsDevices,
  createCsDevice,
  updateCsDevice,
  deleteCsDevice,
  listCsDeviceProfiles,
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
import { Loader2, Plus, Edit, Trash2, Smartphone } from "lucide-react";

type OrgItem = { id: string; name?: string };
type AppItem = { id: string; name?: string };
type DevItem = { id?: string; devEui?: string; name?: string } & Record<
  string,
  any
>;
type ProfileItem = { id: string; name?: string };

export default function DevicesAdminPage() {
  const [orgs, setOrgs] = useState<OrgItem[]>([]);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [devices, setDevices] = useState<DevItem[]>([]);
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
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
    device: DevItem | null;
    name: string;
  }>({
    open: false,
    device: null,
    name: "",
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    device: DevItem | null;
  }>({
    open: false,
    device: null,
  });

  async function loadOrgs() {
    const res = await listOrganizations({ limit: 100 });
    setOrgs((res as any).resultList || []);
  }

  async function loadApps(tenantId: string) {
    const res = await listCsApplications({
      organizationId: tenantId,
      limit: 100,
    });
    setApps((res as any).resultList || []);
  }

  async function loadProfiles(tenantId: string) {
    try {
      const res = await listCsDeviceProfiles({
        tenantId: tenantId,
        limit: 100,
      });
      setProfiles((res as any).resultList || []);
    } catch (e: any) {
      console.error("Failed to load device profiles:", e);
      setProfiles([]);
    }
  }

  async function loadDevices(appId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await listCsDevices({ applicationId: appId, limit: 100 });
      setDevices((res as any).resultList || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load devices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrgs();
  }, []);
  useEffect(() => {
    if (selectedOrg) {
      loadApps(selectedOrg);
      loadProfiles(selectedOrg);
    }
  }, [selectedOrg]);
  useEffect(() => {
    if (selectedApp) loadDevices(selectedApp);
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
      await createCsDevice({
        name: form.name,
        devEui: form.devEui,
        applicationId: selectedApp,
        deviceProfileId: selectedProfile,
      });
      setForm({ name: "", devEui: "" });
      setSelectedProfile(""); // Reset profile selection
      await loadDevices(selectedApp);
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
      await updateCsDevice(
        (editDialog.device.devEui || editDialog.device.id) as string,
        {
          name: editDialog.name,
        }
      );
      await loadDevices(selectedApp);
      setEditDialog({ open: false, device: null, name: "" });
    } catch (e: any) {
      setError(e?.message || "Failed to update device");
    }
  }

  async function handleDelete() {
    if (!deleteDialog.device) return;

    try {
      await deleteCsDevice(
        (deleteDialog.device.devEui || deleteDialog.device.id) as string
      );
      await loadDevices(selectedApp);
      setDeleteDialog({ open: false, device: null });
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
              Manage IoT devices across organizations and applications
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Device Selection & Creation</CardTitle>
            <CardDescription>
              Select an organization and application to view devices, or create
              new ones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org-select">Organization</Label>
                <Select
                  value={selectedOrg}
                  onValueChange={(value) => {
                    setSelectedOrg(value);
                    setSelectedApp("");
                  }}
                >
                  <SelectTrigger id="org-select">
                    <SelectValue placeholder="Select organization..." />
                  </SelectTrigger>
                  <SelectContent>
                    {orgs.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name || o.id}
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
                  disabled={!selectedOrg}
                >
                  <SelectTrigger id="app-select">
                    <SelectValue placeholder="Select application..." />
                  </SelectTrigger>
                  <SelectContent>
                    {apps.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name || a.id}
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
                disabled={!selectedOrg}
              >
                <SelectTrigger id="profile-select">
                  <SelectValue placeholder="Select device profile..." />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name || p.id}
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
                ? "Manage devices in the selected application"
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
                      <TableHead>DevEUI</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devices.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center py-8 text-muted-foreground"
                        >
                          {selectedApp
                            ? "No devices found"
                            : "Select an application to view devices"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      devices.map((d) => (
                        <TableRow key={(d.devEui || d.id) as string}>
                          <TableCell className="font-mono text-sm">
                            {d.devEui || d.id}
                          </TableCell>
                          <TableCell>{d.name}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setEditDialog({
                                    open: true,
                                    device: d,
                                    name: d.name || "",
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
                {editDialog.device?.devEui || editDialog.device?.id}
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
                {deleteDialog.device?.name}" (
                {deleteDialog.device?.devEui || deleteDialog.device?.id})? This
                action cannot be undone.
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
